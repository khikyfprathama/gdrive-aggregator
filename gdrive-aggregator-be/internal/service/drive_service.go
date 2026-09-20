package service

import (
	"context"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"

	"gdrive-aggregator-be/config"
	"gdrive-aggregator-be/internal/model"
	"gdrive-aggregator-be/internal/repository"
	"golang.org/x/oauth2"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)

type DriveService interface {
	GetDriveService(ctx context.Context, account *model.Account) (*drive.Service, error)
	SyncAccountStorage(ctx context.Context, account *model.Account) (*model.Account, error)
	SyncAccountFiles(ctx context.Context, account *model.Account) (int, error)
	SyncFolderFiles(ctx context.Context, account *model.Account, folderDriveID string) (int, error)
	UploadFile(ctx context.Context, account *model.Account, fileHeader *multipart.FileHeader) (*model.FileRecord, error)
	DownloadFileStream(ctx context.Context, account *model.Account, driveFileID string) (io.ReadCloser, *drive.File, error)
	DeleteFile(ctx context.Context, account *model.Account, driveFileID string) error
}

type driveService struct {
	cfg         *config.Config
	accountRepo repository.AccountRepository
	fileRepo    repository.FileRepository
}

func NewDriveService(cfg *config.Config, accountRepo repository.AccountRepository, fileRepo repository.FileRepository) DriveService {
	return &driveService{
		cfg:         cfg,
		accountRepo: accountRepo,
		fileRepo:    fileRepo,
	}
}

// TokenNotifySource wraps oauth2.TokenSource to persist new access/refresh tokens when refreshed
type tokenNotifySource struct {
	source      oauth2.TokenSource
	account     *model.Account
	accountRepo repository.AccountRepository
}

func (s *tokenNotifySource) Token() (*oauth2.Token, error) {
	tok, err := s.source.Token()
	if err != nil {
		return nil, err
	}

	// If token changed or refreshed, persist to database
	if tok.AccessToken != s.account.AccessToken {
		s.account.AccessToken = tok.AccessToken
		s.account.TokenExpiry = tok.Expiry
		if tok.RefreshToken != "" {
			s.account.RefreshToken = tok.RefreshToken
		}
		_ = s.accountRepo.UpdateTokens(s.account.ID, tok.AccessToken, tok.RefreshToken, tok.Expiry)
	}

	return tok, nil
}

func (s *driveService) GetDriveService(ctx context.Context, account *model.Account) (*drive.Service, error) {
	if account == nil {
		return nil, errors.New("akun tidak boleh kosong")
	}

	initialToken := &oauth2.Token{
		AccessToken:  account.AccessToken,
		RefreshToken: account.RefreshToken,
		TokenType:    account.TokenType,
		Expiry:       account.TokenExpiry,
	}

	reuseSource := s.cfg.OAuth2Config.TokenSource(ctx, initialToken)
	notifySource := &tokenNotifySource{
		source:      reuseSource,
		account:     account,
		accountRepo: s.accountRepo,
	}

	srv, err := drive.NewService(ctx, option.WithTokenSource(notifySource))
	if err != nil {
		return nil, fmt.Errorf("gagal membuat client Google Drive: %w", err)
	}

	return srv, nil
}

func (s *driveService) SyncAccountStorage(ctx context.Context, account *model.Account) (*model.Account, error) {
	srv, err := s.GetDriveService(ctx, account)
	if err != nil {
		return nil, err
	}

	about, err := srv.About.Get().Fields("storageQuota").Do()
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil data storage dari Google Drive: %w", err)
	}

	if about.StorageQuota != nil {
		account.StorageLimit = about.StorageQuota.Limit
		account.StorageUsage = about.StorageQuota.Usage
		account.UsageInDrive = about.StorageQuota.UsageInDrive
		account.UsageInTrash = about.StorageQuota.UsageInDriveTrash

		_ = s.accountRepo.UpdateStorage(account.ID, account.StorageLimit, account.StorageUsage, account.UsageInDrive, account.UsageInTrash)
	}

	return account, nil
}

func (s *driveService) UploadFile(ctx context.Context, account *model.Account, fileHeader *multipart.FileHeader) (*model.FileRecord, error) {
	srv, err := s.GetDriveService(ctx, account)
	if err != nil {
		return nil, err
	}

	fileReader, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("gagal membuka file upload: %w", err)
	}
	defer fileReader.Close()

	driveFile := &drive.File{
		Name:     fileHeader.Filename,
		MimeType: fileHeader.Header.Get("Content-Type"),
	}

	// Create file in Drive using media upload stream
	createdFile, err := srv.Files.Create(driveFile).
		Media(fileReader).
		Fields("id, name, mimeType, size, md5Checksum, webViewLink, iconLink, thumbnailLink").
		Context(ctx).
		Do()
	if err != nil {
		return nil, fmt.Errorf("gagal mengunggah file ke Google Drive: %w", err)
	}

	fileRecord := &model.FileRecord{
		AccountID:     account.ID,
		AccountEmail:  account.Email,
		DriveFileID:   createdFile.Id,
		Name:          createdFile.Name,
		MimeType:      createdFile.MimeType,
		Size:          createdFile.Size,
		MD5Checksum:   createdFile.Md5Checksum,
		WebViewLink:   createdFile.WebViewLink,
		IconLink:      createdFile.IconLink,
		ThumbnailLink: createdFile.ThumbnailLink,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := s.fileRepo.Create(fileRecord); err != nil {
		return nil, fmt.Errorf("file terupload di Drive tetapi gagal menyimpan metadata: %w", err)
	}

	// Update quota on account
	_, _ = s.SyncAccountStorage(ctx, account)

	return fileRecord, nil
}

func (s *driveService) DownloadFileStream(ctx context.Context, account *model.Account, driveFileID string) (io.ReadCloser, *drive.File, error) {
	srv, err := s.GetDriveService(ctx, account)
	if err != nil {
		return nil, nil, err
	}

	meta, err := srv.Files.Get(driveFileID).Fields("id, name, mimeType, size").Context(ctx).Do()
	if err != nil {
		return nil, nil, fmt.Errorf("file tidak ditemukan di Google Drive: %w", err)
	}

	resp, err := srv.Files.Get(driveFileID).Download()
	if err != nil {
		return nil, nil, fmt.Errorf("gagal mengunduh file dari Google Drive: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return nil, nil, fmt.Errorf("Google Drive download error: status %d", resp.StatusCode)
	}

	return resp.Body, meta, nil
}

func (s *driveService) DeleteFile(ctx context.Context, account *model.Account, driveFileID string) error {
	srv, err := s.GetDriveService(ctx, account)
	if err != nil {
		return err
	}

	err = srv.Files.Delete(driveFileID).Context(ctx).Do()
	if err != nil {
		return fmt.Errorf("gagal menghapus file dari Google Drive: %w", err)
	}

	_ = s.fileRepo.DeleteByDriveFileID(driveFileID)

	return nil
}

func (s *driveService) SyncFolderFiles(ctx context.Context, account *model.Account, folderDriveID string) (int, error) {
	srv, err := s.GetDriveService(ctx, account)
	if err != nil {
		return 0, err
	}

	count := 0
	pageToken := ""

	for {
		call := srv.Files.List().
			PageSize(1000).
			SupportsAllDrives(true).
			IncludeItemsFromAllDrives(true).
			Q(fmt.Sprintf("'%s' in parents and trashed = false", folderDriveID)).
			Fields("nextPageToken, files(id, name, mimeType, size, md5Checksum, webViewLink, iconLink, thumbnailLink, createdTime, parents)")

		if pageToken != "" {
			call = call.PageToken(pageToken)
		}

		fileList, err := call.Context(ctx).Do()
		if err != nil {
			return count, fmt.Errorf("gagal mengambil isi folder dari Google Drive: %w", err)
		}

		for _, f := range fileList.Files {
			createdAt := time.Now()
			if f.CreatedTime != "" {
				if t, parseErr := time.Parse(time.RFC3339, f.CreatedTime); parseErr == nil {
					createdAt = t
				}
			}

			isFolder := f.MimeType == "application/vnd.google-apps.folder"
			parentID := folderDriveID
			if len(f.Parents) > 0 {
				parentID = f.Parents[0]
			}

			record := &model.FileRecord{
				AccountID:     account.ID,
				AccountEmail:  account.Email,
				DriveFileID:   f.Id,
				Name:          f.Name,
				MimeType:      f.MimeType,
				Size:          f.Size,
				MD5Checksum:   f.Md5Checksum,
				WebViewLink:   f.WebViewLink,
				IconLink:      f.IconLink,
				ThumbnailLink: f.ThumbnailLink,
				IsFolder:      isFolder,
				ParentID:      parentID,
				CreatedAt:     createdAt,
				UpdatedAt:     time.Now(),
			}

			if err := s.fileRepo.Upsert(record); err == nil {
				count++
			}
		}

		if fileList.NextPageToken == "" {
			break
		}
		pageToken = fileList.NextPageToken
	}

	return count, nil
}

func (s *driveService) SyncAccountFiles(ctx context.Context, account *model.Account) (int, error) {
	srv, err := s.GetDriveService(ctx, account)
	if err != nil {
		return 0, err
	}

	count := 0
	pageToken := ""
	var folderIDs []string

	for {
		call := srv.Files.List().
			PageSize(1000).
			SupportsAllDrives(true).
			IncludeItemsFromAllDrives(true).
			Q("trashed = false").
			Fields("nextPageToken, files(id, name, mimeType, size, md5Checksum, webViewLink, iconLink, thumbnailLink, createdTime, parents)")

		if pageToken != "" {
			call = call.PageToken(pageToken)
		}

		fileList, err := call.Context(ctx).Do()
		if err != nil {
			return count, fmt.Errorf("gagal mengambil daftar file dari Google Drive: %w", err)
		}

		for _, f := range fileList.Files {
			createdAt := time.Now()
			if f.CreatedTime != "" {
				if t, parseErr := time.Parse(time.RFC3339, f.CreatedTime); parseErr == nil {
					createdAt = t
				}
			}

			isFolder := f.MimeType == "application/vnd.google-apps.folder"
			if isFolder {
				folderIDs = append(folderIDs, f.Id)
			}

			parentID := ""
			if len(f.Parents) > 0 {
				parentID = f.Parents[0]
			}

			record := &model.FileRecord{
				AccountID:     account.ID,
				AccountEmail:  account.Email,
				DriveFileID:   f.Id,
				Name:          f.Name,
				MimeType:      f.MimeType,
				Size:          f.Size,
				MD5Checksum:   f.Md5Checksum,
				WebViewLink:   f.WebViewLink,
				IconLink:      f.IconLink,
				ThumbnailLink: f.ThumbnailLink,
				IsFolder:      isFolder,
				ParentID:      parentID,
				CreatedAt:     createdAt,
				UpdatedAt:     time.Now(),
			}

			if err := s.fileRepo.Upsert(record); err == nil {
				count++
			}
		}

		if fileList.NextPageToken == "" {
			break
		}
		pageToken = fileList.NextPageToken
	}

	// Deep sync children files for each folder to ensure shared folder contents from others are fully indexed
	for _, folderID := range folderIDs {
		subCount, _ := s.SyncFolderFiles(ctx, account, folderID)
		count += subCount
	}

	// Update quota on account
	_, _ = s.SyncAccountStorage(ctx, account)

	return count, nil
}


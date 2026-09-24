package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"gdrive-aggregator-be/config"
	"gdrive-aggregator-be/internal/model"
	"gdrive-aggregator-be/internal/repository"
	"golang.org/x/oauth2"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)

type OAuthService interface {
	GetAuthURL(state string) string
	HandleCallback(ctx context.Context, code string) (*model.Account, error)
}

type oauthService struct {
	cfg         *config.Config
	accountRepo repository.AccountRepository
}

func NewOAuthService(cfg *config.Config, accountRepo repository.AccountRepository) OAuthService {
	return &oauthService{
		cfg:         cfg,
		accountRepo: accountRepo,
	}
}

func (s *oauthService) GetAuthURL(state string) string {
	if state == "" {
		state = "state-token"
	}
	// access_type=offline and prompt=consent are critical to receive a refresh_token
	return s.cfg.OAuth2Config.AuthCodeURL(
		state,
		oauth2.AccessTypeOffline,
		oauth2.ApprovalForce,
	)
}

type googleUserInfo struct {
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func (s *oauthService) HandleCallback(ctx context.Context, code string) (*model.Account, error) {
	if code == "" {
		return nil, errors.New("authorization code tidak boleh kosong")
	}

	token, err := s.cfg.OAuth2Config.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("gagal menukar code dengan token: %w", err)
	}

	// Fetch user profile info
	client := s.cfg.OAuth2Config.Client(ctx, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil profil pengguna: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Google API error: status %d", resp.StatusCode)
	}

	var userInfo googleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("gagal membaca profil pengguna: %w", err)
	}

	// Fetch storage quota info via Drive API
	driveSrv, err := drive.NewService(ctx, option.WithTokenSource(s.cfg.OAuth2Config.TokenSource(ctx, token)))
	var limit, usage, inDrive, inTrash int64
	if err == nil {
		about, err := driveSrv.About.Get().Fields("storageQuota").Do()
		if err == nil && about.StorageQuota != nil {
			limit = about.StorageQuota.Limit
			usage = about.StorageQuota.Usage
			inDrive = about.StorageQuota.UsageInDrive
			inTrash = about.StorageQuota.UsageInDriveTrash
		}
	}

	account := &model.Account{
		Email:        userInfo.Email,
		DisplayName:  userInfo.Name,
		AvatarURL:    userInfo.Picture,
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		TokenType:    token.TokenType,
		TokenExpiry:  token.Expiry,
		StorageLimit: limit,
		StorageUsage: usage,
		UsageInDrive: inDrive,
		UsageInTrash: inTrash,
		IsActive:     true,
	}

	if err := s.accountRepo.CreateOrUpdate(account); err != nil {
		return nil, fmt.Errorf("gagal menyimpan akun ke database: %w", err)
	}

	savedAccount, err := s.accountRepo.FindByEmail(userInfo.Email)
	if err != nil {
		return account, nil
	}

	return savedAccount, nil
}

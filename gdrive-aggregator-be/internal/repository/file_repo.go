package repository

import (
	"errors"

	"gdrive-aggregator-be/internal/model"
	"gorm.io/gorm"
)

type FileRepository interface {
	Create(file *model.FileRecord) error
	Upsert(file *model.FileRecord) error
	FindByID(id uint) (*model.FileRecord, error)
	FindByIDs(ids []uint) ([]model.FileRecord, error)
	FindByDriveFileID(driveFileID string) (*model.FileRecord, error)
	FindAll(accountID uint, search string, parentID string, limit, offset int) ([]model.FileRecord, int64, error)
	UpdateThumbnailLink(id uint, thumbnailLink string) error
	Delete(id uint) error
	DeleteBatch(ids []uint) error
	DeleteByDriveFileID(driveFileID string) error
}

type fileRepository struct {
	db *gorm.DB
}

func NewFileRepository(db *gorm.DB) *fileRepository {
	return &fileRepository{db: db}
}

func (r *fileRepository) Create(file *model.FileRecord) error {
	return r.db.Create(file).Error
}

func (r *fileRepository) Upsert(file *model.FileRecord) error {
	var existing model.FileRecord
	err := r.db.Where("drive_file_id = ?", file.DriveFileID).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return r.db.Create(file).Error
	} else if err != nil {
		return err
	}
	existing.AccountEmail  = file.AccountEmail
	existing.Name          = file.Name
	existing.MimeType      = file.MimeType
	existing.Size          = file.Size
	existing.MD5Checksum   = file.MD5Checksum
	existing.WebViewLink   = file.WebViewLink
	existing.IconLink      = file.IconLink
	existing.ThumbnailLink = file.ThumbnailLink
	existing.IsFolder      = file.IsFolder
	existing.ParentID      = file.ParentID
	return r.db.Save(&existing).Error
}

func (r *fileRepository) FindByID(id uint) (*model.FileRecord, error) {
	var file model.FileRecord
	err := r.db.Table("file_records").
		Select("file_records.*, accounts.email as account_email").
		Joins("left join accounts on accounts.id = file_records.account_id").
		Where("file_records.id = ?", id).
		First(&file).Error
	if err != nil {
		return nil, err
	}
	return &file, nil
}

func (r *fileRepository) FindByIDs(ids []uint) ([]model.FileRecord, error) {
	var files []model.FileRecord
	err := r.db.Table("file_records").
		Select("file_records.*, accounts.email as account_email").
		Joins("left join accounts on accounts.id = file_records.account_id").
		Where("file_records.id IN ?", ids).
		Find(&files).Error
	return files, err
}

func (r *fileRepository) FindByDriveFileID(driveFileID string) (*model.FileRecord, error) {
	var file model.FileRecord
	err := r.db.Table("file_records").
		Select("file_records.*, accounts.email as account_email").
		Joins("left join accounts on accounts.id = file_records.account_id").
		Where("file_records.drive_file_id = ?", driveFileID).
		First(&file).Error
	if err != nil {
		return nil, err
	}
	return &file, nil
}

func (r *fileRepository) FindAll(accountID uint, search string, parentID string, limit, offset int) ([]model.FileRecord, int64, error) {
	var files []model.FileRecord
	var total int64

	query := r.db.Table("file_records").
		Select("file_records.*, accounts.email as account_email").
		Joins("left join accounts on accounts.id = file_records.account_id")

	if accountID > 0 {
		query = query.Where("file_records.account_id = ?", accountID)
	}

	if parentID != "" {
		if parentID == "root" {
			query = query.Where("file_records.parent_id = '' OR file_records.parent_id IS NULL")
		} else {
			query = query.Where("file_records.parent_id = ?", parentID)
		}
	}

	if search != "" {
		query = query.Where("file_records.name LIKE ?", "%"+search+"%")
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	if limit <= 0 {
		limit = 20
	}
	err = query.Order("file_records.is_folder desc, file_records.created_at desc").Limit(limit).Offset(offset).Find(&files).Error
	return files, total, err
}

func (r *fileRepository) Delete(id uint) error {
	return r.db.Delete(&model.FileRecord{}, id).Error
}

func (r *fileRepository) UpdateThumbnailLink(id uint, thumbnailLink string) error {
	return r.db.Model(&model.FileRecord{}).Where("id = ?", id).Update("thumbnail_link", thumbnailLink).Error
}

func (r *fileRepository) DeleteBatch(ids []uint) error {
	return r.db.Where("id IN ?", ids).Delete(&model.FileRecord{}).Error
}

func (r *fileRepository) DeleteByDriveFileID(driveFileID string) error {
	return r.db.Where("drive_file_id = ?", driveFileID).Delete(&model.FileRecord{}).Error
}


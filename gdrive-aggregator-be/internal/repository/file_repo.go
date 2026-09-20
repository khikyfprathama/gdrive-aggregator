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
	existing.Name = file.Name
	existing.MimeType = file.MimeType
	existing.Size = file.Size
	existing.MD5Checksum = file.MD5Checksum
	existing.WebViewLink = file.WebViewLink
	existing.IconLink = file.IconLink
	existing.IsFolder = file.IsFolder
	existing.ParentID = file.ParentID
	return r.db.Save(&existing).Error
}

func (r *fileRepository) FindByID(id uint) (*model.FileRecord, error) {
	var file model.FileRecord
	err := r.db.First(&file, id).Error
	if err != nil {
		return nil, err
	}
	return &file, nil
}

func (r *fileRepository) FindByIDs(ids []uint) ([]model.FileRecord, error) {
	var files []model.FileRecord
	err := r.db.Where("id IN ?", ids).Find(&files).Error
	return files, err
}

func (r *fileRepository) FindByDriveFileID(driveFileID string) (*model.FileRecord, error) {
	var file model.FileRecord
	err := r.db.Where("drive_file_id = ?", driveFileID).First(&file).Error
	if err != nil {
		return nil, err
	}
	return &file, nil
}

func (r *fileRepository) FindAll(accountID uint, search string, parentID string, limit, offset int) ([]model.FileRecord, int64, error) {
	var files []model.FileRecord
	var total int64

	query := r.db.Model(&model.FileRecord{})
	if accountID > 0 {
		query = query.Where("account_id = ?", accountID)
	}
	if search != "" {
		query = query.Where("name LIKE ?", "%"+search+"%")
	} else if parentID != "" {
		if parentID == "root" {
			query = query.Where("parent_id = '' OR parent_id IS NULL")
		} else {
			query = query.Where("parent_id = ?", parentID)
		}
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	if limit <= 0 {
		limit = 20
	}
	err = query.Order("is_folder desc, created_at desc").Limit(limit).Offset(offset).Find(&files).Error
	return files, total, err
}

func (r *fileRepository) Delete(id uint) error {
	return r.db.Delete(&model.FileRecord{}, id).Error
}

func (r *fileRepository) DeleteBatch(ids []uint) error {
	return r.db.Where("id IN ?", ids).Delete(&model.FileRecord{}).Error
}

func (r *fileRepository) DeleteByDriveFileID(driveFileID string) error {
	return r.db.Where("drive_file_id = ?", driveFileID).Delete(&model.FileRecord{}).Error
}


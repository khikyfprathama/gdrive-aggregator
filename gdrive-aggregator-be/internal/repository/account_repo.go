package repository

import (
	"errors"
	"time"

	"gdrive-aggregator-be/internal/model"
	"gorm.io/gorm"
)

type AccountRepository interface {
	CreateOrUpdate(account *model.Account) error
	FindByID(id uint) (*model.Account, error)
	FindByEmail(email string) (*model.Account, error)
	FindAll() ([]model.Account, error)
	FindActive() ([]model.Account, error)
	UpdateTokens(id uint, accessToken, refreshToken string, expiry time.Time) error
	UpdateStorage(id uint, limit, usage, inDrive, inTrash int64) error
	Delete(id uint) error
}

type accountRepository struct {
	db *gorm.DB
}

func NewAccountRepository(db *gorm.DB) *accountRepository {
	return &accountRepository{db: db}
}

func (r *accountRepository) CreateOrUpdate(account *model.Account) error {
	var existing model.Account
	err := r.db.Where("email = ?", account.Email).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return r.db.Create(account).Error
	} else if err != nil {
		return err
	}

	// Update existing account fields
	existing.DisplayName = account.DisplayName
	existing.AvatarURL = account.AvatarURL
	existing.AccessToken = account.AccessToken
	if account.RefreshToken != "" {
		existing.RefreshToken = account.RefreshToken
	}
	existing.TokenType = account.TokenType
	existing.TokenExpiry = account.TokenExpiry
	existing.IsActive = true
	if account.StorageLimit > 0 {
		existing.StorageLimit = account.StorageLimit
		existing.StorageUsage = account.StorageUsage
		existing.UsageInDrive = account.UsageInDrive
		existing.UsageInTrash = account.UsageInTrash
	}

	return r.db.Save(&existing).Error
}

func (r *accountRepository) FindByID(id uint) (*model.Account, error) {
	var account model.Account
	err := r.db.First(&account, id).Error
	if err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *accountRepository) FindByEmail(email string) (*model.Account, error) {
	var account model.Account
	err := r.db.Where("email = ?", email).First(&account).Error
	if err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *accountRepository) FindAll() ([]model.Account, error) {
	var accounts []model.Account
	err := r.db.Order("id asc").Find(&accounts).Error
	return accounts, err
}

func (r *accountRepository) FindActive() ([]model.Account, error) {
	var accounts []model.Account
	err := r.db.Where("is_active = ?", true).Order("id asc").Find(&accounts).Error
	return accounts, err
}

func (r *accountRepository) UpdateTokens(id uint, accessToken, refreshToken string, expiry time.Time) error {
	updates := map[string]interface{}{
		"access_token": accessToken,
		"token_expiry": expiry,
	}
	if refreshToken != "" {
		updates["refresh_token"] = refreshToken
	}
	return r.db.Model(&model.Account{}).Where("id = ?", id).Updates(updates).Error
}

func (r *accountRepository) UpdateStorage(id uint, limit, usage, inDrive, inTrash int64) error {
	return r.db.Model(&model.Account{}).Where("id = ?", id).Updates(map[string]interface{}{
		"storage_limit":  limit,
		"storage_usage":  usage,
		"usage_in_drive": inDrive,
		"usage_in_trash": inTrash,
	}).Error
}

func (r *accountRepository) Delete(id uint) error {
	return r.db.Delete(&model.Account{}, id).Error
}

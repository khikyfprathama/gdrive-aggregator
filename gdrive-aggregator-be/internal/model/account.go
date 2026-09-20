package model

import (
	"time"
)

type Account struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	DisplayName  string    `json:"display_name"`
	AvatarURL    string    `json:"avatar_url"`
	AccessToken  string    `gorm:"not null" json:"-"`
	RefreshToken string    `gorm:"not null" json:"-"`
	TokenType    string    `json:"-"`
	TokenExpiry  time.Time `json:"-"`
	StorageLimit int64     `gorm:"default:0" json:"storage_limit"` // bytes
	StorageUsage int64     `gorm:"default:0" json:"storage_usage"` // bytes
	UsageInDrive int64     `gorm:"default:0" json:"usage_in_drive"`
	UsageInTrash int64     `gorm:"default:0" json:"usage_in_trash"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	// Relations
	Files []FileRecord `gorm:"foreignKey:AccountID;constraint:OnDelete:CASCADE" json:"files,omitempty"`
}

func (a *Account) FreeStorage() int64 {
	if a.StorageLimit <= 0 {
		return 0
	}
	free := a.StorageLimit - a.StorageUsage
	if free < 0 {
		return 0
	}
	return free
}

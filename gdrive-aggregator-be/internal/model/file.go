package model

import (
	"time"
)

type FileRecord struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	AccountID    uint      `gorm:"index;not null" json:"account_id"`
	AccountEmail string    `json:"account_email"`
	DriveFileID  string    `gorm:"uniqueIndex;not null" json:"drive_file_id"`
	Name         string    `gorm:"not null" json:"name"`
	MimeType     string    `json:"mime_type"`
	Size         int64     `gorm:"default:0" json:"size"` // bytes
	MD5Checksum  string    `json:"md5_checksum,omitempty"`
	WebViewLink  string    `json:"web_view_link,omitempty"`
	IconLink      string    `json:"icon_link,omitempty"`
	ThumbnailLink string    `json:"thumbnail_link,omitempty"`
	IsFolder     bool      `gorm:"default:false;index" json:"is_folder"`
	ParentID     string    `gorm:"index" json:"parent_id,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}


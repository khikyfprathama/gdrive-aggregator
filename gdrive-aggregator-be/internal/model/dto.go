package model

// BaseResponse adalah format standar response JSON API
type BaseResponse struct {
	Success bool        `json:"success" example:"true"`
	Message string      `json:"message" example:"Operation successful"`
	Data    interface{} `json:"data,omitempty"`
}

// ErrorResponse adalah format response ketika terjadi error
type ErrorResponse struct {
	Success bool   `json:"success" example:"false"`
	Message string `json:"message" example:"Terjadi kesalahan"`
	Error   string `json:"error,omitempty" example:"detail error"`
}

// AuthURLResponse untuk endpoint generate OAuth Google URL
type AuthURLResponse struct {
	AuthURL string `json:"auth_url" example:"https://accounts.google.com/o/oauth2/auth?..."`
}

// StorageOverviewDTO untuk statistik pool storage gabungan
type StorageOverviewDTO struct {
	TotalLimitBytes  int64              `json:"total_limit_bytes" example:"32212254720"`
	TotalUsageBytes  int64              `json:"total_usage_bytes" example:"10737418240"`
	TotalFreeBytes   int64              `json:"total_free_bytes" example:"21474836480"`
	TotalLimitHuman  string             `json:"total_limit_human" example:"30.00 GB"`
	TotalUsageHuman  string             `json:"total_usage_human" example:"10.00 GB"`
	TotalFreeHuman   string             `json:"total_free_human" example:"20.00 GB"`
	UsagePercentage  float64            `json:"usage_percentage" example:"33.33"`
	AccountCount     int                `json:"account_count" example:"2"`
	AccountsOverview []AccountSimpleDTO `json:"accounts"`
}

// AccountSimpleDTO untuk rincian akun di ringkasan storage
type AccountSimpleDTO struct {
	ID              uint    `json:"id" example:"1"`
	Email           string  `json:"email" example:"user@gmail.com"`
	DisplayName     string  `json:"display_name" example:"John Doe"`
	AvatarURL       string  `json:"avatar_url" example:"https://..."`
	StorageLimit    int64   `json:"storage_limit" example:"16106127360"`
	StorageUsage    int64   `json:"storage_usage" example:"5368709120"`
	FreeStorage     int64   `json:"free_storage" example:"10737418240"`
	StorageLimitStr string  `json:"storage_limit_str" example:"15.00 GB"`
	StorageUsageStr string  `json:"storage_usage_str" example:"5.00 GB"`
	FreeStorageStr  string  `json:"free_storage_str" example:"10.00 GB"`
	UsagePercent    float64 `json:"usage_percent" example:"33.33"`
	IsActive        bool    `json:"is_active" example:"true"`
}

// FileUploadResponseDTO respon setelah file berhasil diupload
type FileUploadResponseDTO struct {
	FileID       uint   `json:"file_id" example:"1"`
	DriveFileID  string `json:"drive_file_id" example:"1a2b3c4d..."`
	Name         string `json:"name" example:"document.pdf"`
	Size         int64  `json:"size" example:"1048576"`
	SizeHuman    string `json:"size_human" example:"1.00 MB"`
	MimeType     string `json:"mime_type" example:"application/pdf"`
	AccountID    uint   `json:"account_id" example:"1"`
	AccountEmail string `json:"account_email" example:"user@gmail.com"`
	WebViewLink  string `json:"web_view_link,omitempty" example:"https://drive.google.com/file/d/..."`
}

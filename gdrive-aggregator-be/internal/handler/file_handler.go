package handler

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gdrive-aggregator-be/internal/model"
	"gdrive-aggregator-be/internal/repository"
	"gdrive-aggregator-be/internal/service"
)

type FileHandler struct {
	fileRepo       repository.FileRepository
	accountRepo    repository.AccountRepository
	driveService   service.DriveService
	storageService service.StorageService
}

func NewFileHandler(
	fileRepo repository.FileRepository,
	accountRepo repository.AccountRepository,
	driveService service.DriveService,
	storageService service.StorageService,
) *FileHandler {
	return &FileHandler{
		fileRepo:       fileRepo,
		accountRepo:    accountRepo,
		driveService:   driveService,
		storageService: storageService,
	}
}

// ListFiles godoc
// @Summary      Daftar Semua File
// @Description  Menampilkan metadata file dari seluruh akun Google Drive yang teragregasi
// @Tags         Files
// @Accept       json
// @Produce      json
// @Param        account_id query int false "Filter berdasarkan ID akun"
// @Param        search query string false "Cari berdasarkan nama file"
// @Param        limit query int false "Jumlah per halaman (default 20)"
// @Param        offset query int false "Offset pagination (default 0)"
// @Success      200 {object} model.BaseResponse{data=[]model.FileRecord}
// @Failure      500 {object} model.ErrorResponse
// @Router       /api/v1/files [get]
func (h *FileHandler) ListFiles(c *gin.Context) {
	accountIDStr := c.Query("account_id")
	search := c.Query("search")
	parentID := c.Query("parent_id")
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	var accountID uint
	if accountIDStr != "" {
		if id, err := strconv.ParseUint(accountIDStr, 10, 32); err == nil {
			accountID = uint(id)
		}
	}

	limit := 20
	if limitStr == "all" || limitStr == "-1" {
		limit = -1
	} else if l, err := strconv.Atoi(limitStr); err == nil {
		limit = l
	}
	offset, _ := strconv.Atoi(offsetStr)

	files, total, err := h.fileRepo.FindAll(accountID, search, parentID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil daftar file",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Daftar file berhasil diambil",
		"total":   total,
		"limit":   limit,
		"offset":  offset,
		"data":    files,
	})
}

// UploadFile godoc
// @Summary      Upload File ke Google Drive
// @Description  Mengunggah file biner. Jika account_id tidak diisi, sistem otomatis memilih akun dengan sisa kuota terbesar (*Smart Storage Allocation*).
// @Tags         Files
// @Accept       multipart/form-data
// @Produce      json
// @Param        file formData file true "Pilih file yang ingin diunggah"
// @Param        account_id formData int false "ID Akun tujuan (opsional, default: auto-pilih akun paling lega)"
// @Success      200 {object} model.BaseResponse{data=model.FileUploadResponseDTO}
// @Failure      400 {object} model.ErrorResponse
// @Failure      500 {object} model.ErrorResponse
// @Router       /api/v1/files/upload [post]
func (h *FileHandler) UploadFile(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "File wajib disertakan dalam form field 'file'",
			Error:   err.Error(),
		})
		return
	}

	accountIDStr := c.PostForm("account_id")
	var targetAccount *model.Account

	if accountIDStr != "" {
		id, err := strconv.ParseUint(accountIDStr, 10, 32)
		if err == nil && id > 0 {
			acc, err := h.accountRepo.FindByID(uint(id))
			if err != nil {
				c.JSON(http.StatusBadRequest, model.ErrorResponse{
					Success: false,
					Message: "Akun tujuan yang dipilih tidak ditemukan",
				})
				return
			}
			if acc.FreeStorage() < fileHeader.Size {
				c.JSON(http.StatusBadRequest, model.ErrorResponse{
					Success: false,
					Message: fmt.Sprintf("Akun %s tidak memiliki sisa ruang yang cukup (%d bytes dibutuhkan)", acc.Email, fileHeader.Size),
				})
				return
			}
			targetAccount = acc
		}
	}

	// Smart allocation if no account specified
	if targetAccount == nil {
		acc, err := h.storageService.SelectOptimalAccountForUpload(c.Request.Context(), fileHeader.Size)
		if err != nil {
			c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Success: false,
				Message: "Gagal memilih akun penyimpanan",
				Error:   err.Error(),
			})
			return
		}
		targetAccount = acc
	}

	// Upload directly to Google Drive
	fileRecord, err := h.driveService.UploadFile(c.Request.Context(), targetAccount, fileHeader)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Message: "Gagal mengunggah file ke Google Drive",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.BaseResponse{
		Success: true,
		Message: fmt.Sprintf("File '%s' berhasil diunggah ke akun %s", fileRecord.Name, targetAccount.Email),
		Data: model.FileUploadResponseDTO{
			FileID:       fileRecord.ID,
			DriveFileID:  fileRecord.DriveFileID,
			Name:         fileRecord.Name,
			Size:         fileRecord.Size,
			SizeHuman:    formatBytes(fileRecord.Size),
			MimeType:     fileRecord.MimeType,
			AccountID:    targetAccount.ID,
			AccountEmail: targetAccount.Email,
			WebViewLink:  fileRecord.WebViewLink,
		},
	})
}

func formatBytes(b int64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.2f %cB", float64(b)/float64(div), "KMGTPE"[exp])
}

// DownloadFile godoc
// @Summary      Stream Download File
// @Description  Mengunduh file langsung dari Google Drive akun bersangkutan via streaming
// @Tags         Files
// @Produce      application/octet-stream
// @Param        id path int true "ID file di database"
// @Success      200 {file} binary "File stream"
// @Failure      404 {object} model.ErrorResponse
// @Failure      500 {object} model.ErrorResponse
// @Router       /api/v1/files/download/{id} [get]
func (h *FileHandler) DownloadFile(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Format ID file tidak valid",
		})
		return
	}

	fileRecord, err := h.fileRepo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, model.ErrorResponse{
			Success: false,
			Message: "File tidak ditemukan di database",
		})
		return
	}

	account, err := h.accountRepo.FindByID(fileRecord.AccountID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Message: "Akun Google Drive penyimpan file tidak ditemukan",
		})
		return
	}

	stream, meta, err := h.driveService.DownloadFileStream(c.Request.Context(), account, fileRecord.DriveFileID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil file dari Google Drive",
			Error:   err.Error(),
		})
		return
	}
	defer stream.Close()

	fileName := fileRecord.Name
	if meta != nil && meta.Name != "" {
		fileName = meta.Name
	}

	mimeType := fileRecord.MimeType
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	disposition := "attachment"
	if c.Query("inline") == "1" || c.Query("inline") == "true" || c.Query("preview") == "1" || c.Query("preview") == "true" {
		disposition = "inline"
	}

	extraHeaders := map[string]string{
		"Content-Disposition": fmt.Sprintf(`%s; filename="%s"`, disposition, fileName),
		"Cache-Control":       "public, max-age=86400",
	}

	c.DataFromReader(http.StatusOK, fileRecord.Size, mimeType, stream, extraHeaders)
}

// ThumbnailFile godoc
// @Summary      Pratinjau Thumbnail File (Cepat, Non-Streaming)
// @Description  Mengembalikan thumbnail ringan berukuran kecil langsung dari CDN Google Drive tanpa meng-stream file penuh. Ideal untuk preview grid dan pratinjau modal. Redirect 302 ke URL thumbnail CDN Google Drive.
// @Tags         Files
// @Produce      image/*
// @Param        id path int true "ID file di database"
// @Success      302 "Redirect ke thumbnail CDN Google Drive"
// @Failure      404 {object} model.ErrorResponse
// @Failure      500 {object} model.ErrorResponse
// @Router       /api/v1/files/thumbnail/{id} [get]
func (h *FileHandler) ThumbnailFile(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Format ID file tidak valid",
		})
		return
	}

	fileRecord, err := h.fileRepo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, model.ErrorResponse{
			Success: false,
			Message: "File tidak ditemukan di database",
		})
		return
	}

	// If file already has a cached thumbnail_link, redirect directly to CDN — zero bandwidth on backend
	if fileRecord.ThumbnailLink != "" {
		// Google Drive thumbnail links can have size adjusted via query param
		// Replace existing sz param or append one for a reasonable preview size (max width 800)
		thumbURL := fileRecord.ThumbnailLink
		c.Header("Cache-Control", "public, max-age=604800") // 7 days
		c.Redirect(http.StatusFound, thumbURL)
		return
	}

	// Fallback: no cached thumbnail_link — fetch it live from Drive API and redirect
	account, err := h.accountRepo.FindByID(fileRecord.AccountID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Message: "Akun Google Drive penyimpan file tidak ditemukan",
		})
		return
	}

	srv, err := h.driveService.GetDriveService(c.Request.Context(), account)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Message: "Gagal membuat koneksi ke Google Drive",
		})
		return
	}

	meta, err := srv.Files.Get(fileRecord.DriveFileID).Fields("thumbnailLink, webContentLink").Context(c.Request.Context()).Do()
	if err != nil {
		// Final fallback: stream full file (original behavior)
		c.Redirect(http.StatusFound, fmt.Sprintf("/api/v1/files/download/%d?inline=1", fileRecord.ID))
		return
	}

	if meta.ThumbnailLink != "" {
		// Persist for next time so we skip this round-trip
		fileRecord.ThumbnailLink = meta.ThumbnailLink
		_ = h.fileRepo.UpdateThumbnailLink(fileRecord.ID, meta.ThumbnailLink)

		c.Header("Cache-Control", "public, max-age=604800")
		c.Redirect(http.StatusFound, meta.ThumbnailLink)
		return
	}

	// No thumbnail at all (rare): redirect to full inline download
	c.Redirect(http.StatusFound, fmt.Sprintf("/api/v1/files/download/%d?inline=1", fileRecord.ID))
}


// DeleteFile godoc
// @Summary      Hapus File
// @Description  Menghapus file dari Google Drive dan database lokal
// @Tags         Files
// @Accept       json
// @Produce      json
// @Param        id path int true "ID file di database"
// @Success      200 {object} model.BaseResponse
// @Failure      404 {object} model.ErrorResponse
// @Failure      500 {object} model.ErrorResponse
// @Router       /api/v1/files/{id} [delete]
func (h *FileHandler) DeleteFile(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Format ID file tidak valid",
		})
		return
	}

	fileRecord, err := h.fileRepo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, model.ErrorResponse{
			Success: false,
			Message: "File tidak ditemukan",
		})
		return
	}

	account, err := h.accountRepo.FindByID(fileRecord.AccountID)
	if err == nil && account != nil {
		_ = h.driveService.DeleteFile(c.Request.Context(), account, fileRecord.DriveFileID)
	}

	_ = h.fileRepo.Delete(fileRecord.ID)

	c.JSON(http.StatusOK, model.BaseResponse{
		Success: true,
		Message: fmt.Sprintf("File '%s' berhasil dihapus", fileRecord.Name),
	})
}

// SyncFiles godoc
// @Summary      Sinkronisasi/Impor File dari Google Drive
// @Description  Memindai dan mengimpor file yang sudah ada di akun Google Drive ke database lokal
// @Tags         Files
// @Accept       json
// @Produce      json
// @Param        account_id query int false "ID Akun Google Drive (opsional, jika kosong sinkronisasi semua akun)"
// @Success      200 {object} model.BaseResponse{data=map[string]interface{}}
// @Failure      500 {object} model.ErrorResponse
// @Router       /api/v1/files/sync [post]
func (h *FileHandler) SyncFiles(c *gin.Context) {
	accountIDStr := c.Query("account_id")

	var accounts []*model.Account
	if accountIDStr != "" {
		id, err := strconv.ParseUint(accountIDStr, 10, 32)
		if err == nil && id > 0 {
			acc, err := h.accountRepo.FindByID(uint(id))
			if err != nil {
				c.JSON(http.StatusNotFound, model.ErrorResponse{
					Success: false,
					Message: "Akun tidak ditemukan",
				})
				return
			}
			accounts = append(accounts, acc)
		}
	}

	if len(accounts) == 0 {
		activeList, err := h.accountRepo.FindActive()
		if err != nil {
			c.JSON(http.StatusInternalServerError, model.ErrorResponse{
				Success: false,
				Message: fmt.Sprintf("Gagal mengambil daftar akun aktif: %v", err),
			})
			return
		}
		for i := range activeList {
			accounts = append(accounts, &activeList[i])
		}
	}

	totalSynced := 0
	for _, acc := range accounts {
		synced, err := h.driveService.SyncAccountFiles(c.Request.Context(), acc)
		if err == nil {
			totalSynced += synced
		}
	}

	c.JSON(http.StatusOK, model.BaseResponse{
		Success: true,
		Message: fmt.Sprintf("Sinkronisasi selesai. %d file berhasil diindeks dari %d akun.", totalSynced, len(accounts)),
		Data: gin.H{
			"synced_files":       totalSynced,
			"accounts_processed": len(accounts),
		},
	})
}

type BatchDeleteRequest struct {
	IDs []uint `json:"ids" binding:"required"`
}

// BatchDeleteFiles godoc
// @Summary      Hapus Beberapa File Sekaligus
// @Description  Menghapus kumpulan file terpilih dari Google Drive dan database lokal
// @Tags         Files
// @Accept       json
// @Produce      json
// @Param        request body BatchDeleteRequest true "Daftar ID file yang ingin dihapus"
// @Success      200 {object} model.BaseResponse{data=map[string]interface{}}
// @Failure      400 {object} model.ErrorResponse
// @Failure      500 {object} model.ErrorResponse
// @Router       /api/v1/files/batch-delete [post]
func (h *FileHandler) BatchDeleteFiles(c *gin.Context) {
	var req BatchDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil || len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Daftar ID file wajib diisi",
		})
		return
	}

	files, err := h.fileRepo.FindByIDs(req.IDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil data file untuk dihapus",
		})
		return
	}

	deletedCount := 0
	for _, file := range files {
		account, err := h.accountRepo.FindByID(file.AccountID)
		if err == nil && account != nil {
			_ = h.driveService.DeleteFile(c.Request.Context(), account, file.DriveFileID)
		}
		_ = h.fileRepo.Delete(file.ID)
		deletedCount++
	}

	c.JSON(http.StatusOK, model.BaseResponse{
		Success: true,
		Message: fmt.Sprintf("%d file/folder berhasil dihapus", deletedCount),
		Data: gin.H{
			"deleted_count": deletedCount,
		},
	})
}



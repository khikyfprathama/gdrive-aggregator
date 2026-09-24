package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gdrive-aggregator-be/internal/model"
	"gdrive-aggregator-be/internal/repository"
	"gdrive-aggregator-be/internal/service"
)

type AccountHandler struct {
	accountRepo  repository.AccountRepository
	driveService service.DriveService
}

func NewAccountHandler(accountRepo repository.AccountRepository, driveService service.DriveService) *AccountHandler {
	return &AccountHandler{
		accountRepo:  accountRepo,
		driveService: driveService,
	}
}

// ListAccounts godoc
// @Summary      Daftar Semua Akun Terhubung
// @Description  Menampilkan semua akun Google yang terhubung ke aggregator
// @Tags         Accounts
// @Accept       json
// @Produce      json
// @Success      200 {object} model.BaseResponse{data=[]model.Account}
// @Failure      500 {object} model.ErrorResponse
// @Router       /api/v1/accounts [get]
func (h *AccountHandler) ListAccounts(c *gin.Context) {
	accounts, err := h.accountRepo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil daftar akun",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.BaseResponse{
		Success: true,
		Message: "Daftar akun berhasil diambil",
		Data:    accounts,
	})
}

// GetAccount godoc
// @Summary      Detail Akun
// @Description  Menampilkan detail akun Google tertentu berdasarkan ID
// @Tags         Accounts
// @Accept       json
// @Produce      json
// @Param        id path int true "ID Akun"
// @Success      200 {object} model.BaseResponse{data=model.Account}
// @Failure      404 {object} model.ErrorResponse
// @Router       /api/v1/accounts/{id} [get]
func (h *AccountHandler) GetAccount(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Format ID akun tidak valid",
		})
		return
	}

	account, err := h.accountRepo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, model.ErrorResponse{
			Success: false,
			Message: "Akun tidak ditemukan",
		})
		return
	}

	c.JSON(http.StatusOK, model.BaseResponse{
		Success: true,
		Message: "Detail akun berhasil diambil",
		Data:    account,
	})
}

// SyncAccount godoc
// @Summary      Sinkronisasi Kuota Akun
// @Description  Memperbarui data penggunaan storage akun langsung dari Google Drive API
// @Tags         Accounts
// @Accept       json
// @Produce      json
// @Param        id path int true "ID Akun"
// @Success      200 {object} model.BaseResponse{data=model.Account}
// @Failure      404 {object} model.ErrorResponse
// @Failure      500 {object} model.ErrorResponse
// @Router       /api/v1/accounts/{id}/sync [post]
func (h *AccountHandler) SyncAccount(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Format ID akun tidak valid",
		})
		return
	}

	account, err := h.accountRepo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, model.ErrorResponse{
			Success: false,
			Message: "Akun tidak ditemukan",
		})
		return
	}

	syncedAccount, err := h.driveService.SyncAccountStorage(c.Request.Context(), account)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Message: "Gagal sinkronisasi kuota dengan Google Drive",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.BaseResponse{
		Success: true,
		Message: "Kuota akun berhasil diperbarui",
		Data:    syncedAccount,
	})
}

// DeleteAccount godoc
// @Summary      Hapus / Putuskan Akun
// @Description  Menghapus akun Google dari aggregator
// @Tags         Accounts
// @Accept       json
// @Produce      json
// @Param        id path int true "ID Akun"
// @Success      200 {object} model.BaseResponse
// @Failure      400 {object} model.ErrorResponse
// @Failure      500 {object} model.ErrorResponse
// @Router       /api/v1/accounts/{id} [delete]
func (h *AccountHandler) DeleteAccount(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Format ID akun tidak valid",
		})
		return
	}

	if err := h.accountRepo.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Message: "Gagal menghapus akun",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.BaseResponse{
		Success: true,
		Message: "Akun berhasil diputuskan dari aggregator",
	})
}

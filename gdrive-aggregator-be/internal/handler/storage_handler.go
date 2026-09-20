package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gdrive-aggregator-be/internal/model"
	"gdrive-aggregator-be/internal/service"
)

type StorageHandler struct {
	storageService service.StorageService
}

func NewStorageHandler(storageService service.StorageService) *StorageHandler {
	return &StorageHandler{storageService: storageService}
}

// GetStorageOverview godoc
// @Summary      Ringkasan Pool Storage Agregator
// @Description  Menampilkan total kapasitas, penggunaan, dan sisa ruang dari seluruh akun Google yang terhubung
// @Tags         Storage
// @Accept       json
// @Produce      json
// @Success      200 {object} model.BaseResponse{data=model.StorageOverviewDTO}
// @Failure      500 {object} model.ErrorResponse
// @Router       /api/v1/storage/overview [get]
func (h *StorageHandler) GetStorageOverview(c *gin.Context) {
	overview, err := h.storageService.GetStorageOverview(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Message: "Gagal menghitung ringkasan storage",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.BaseResponse{
		Success: true,
		Message: "Ringkasan storage berhasil diambil",
		Data:    overview,
	})
}

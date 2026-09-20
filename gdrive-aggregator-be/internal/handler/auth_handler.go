package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gdrive-aggregator-be/internal/model"
	"gdrive-aggregator-be/internal/service"
)

type AuthHandler struct {
	oauthService service.OAuthService
}

func NewAuthHandler(oauthService service.OAuthService) *AuthHandler {
	return &AuthHandler{oauthService: oauthService}
}

// GetAuthURL godoc
// @Summary      Dapatkan URL Login Google OAuth2
// @Description  Menghasilkan URL autentikasi Google untuk menghubungkan akun Gmail/Drive baru
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Success      200 {object} model.BaseResponse{data=model.AuthURLResponse}
// @Router       /api/v1/auth/google/url [get]
func (h *AuthHandler) GetAuthURL(c *gin.Context) {
	state := c.DefaultQuery("state", "gdrive-aggregator-state")
	authURL := h.oauthService.GetAuthURL(state)

	c.JSON(http.StatusOK, model.BaseResponse{
		Success: true,
		Message: "URL autentikasi Google berhasil dibuat",
		Data: model.AuthURLResponse{
			AuthURL: authURL,
		},
	})
}

// Callback godoc
// @Summary      Callback Google OAuth2
// @Description  Menerima authorization code dari Google dan menyimpan token akun ke database
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        code query string true "Authorization code dari Google"
// @Success      200 {object} model.BaseResponse{data=model.Account}
// @Failure      400 {object} model.ErrorResponse
// @Failure      500 {object} model.ErrorResponse
// @Router       /api/v1/auth/google/callback [get]
func (h *AuthHandler) Callback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Message: "Parameter 'code' tidak ditemukan pada callback",
		})
		return
	}

	account, err := h.oauthService.HandleCallback(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Message: "Gagal memproses autentikasi Google",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.BaseResponse{
		Success: true,
		Message: "Akun Google Drive berhasil dihubungkan!",
		Data:    account,
	})
}

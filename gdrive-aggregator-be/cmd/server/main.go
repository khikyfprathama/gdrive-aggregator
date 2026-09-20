package main

import (
	"fmt"
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"gdrive-aggregator-be/config"
	_ "gdrive-aggregator-be/docs" // load auto-generated Swagger docs
	"gdrive-aggregator-be/internal/database"
	"gdrive-aggregator-be/internal/handler"
	"gdrive-aggregator-be/internal/repository"
	"gdrive-aggregator-be/internal/service"
)

// @title           Google Drive Aggregator API
// @version         1.0
// @description     REST API untuk mengagregasi beberapa akun Google Drive ke dalam satu storage pool terpusat.
// @description     Mendukung smart allocation (otomatis pilih akun dengan sisa kuota terbesar), streaming download, dan manajemen multi-akun.
// @contact.name    Google Drive Aggregator Support
// @BasePath        /

func main() {
	// 1. Load Configurations
	cfg := config.LoadConfig()

	// 2. Initialize Database
	db := database.InitDB(cfg.DBPath)

	// 3. Initialize Repositories
	accountRepo := repository.NewAccountRepository(db)
	fileRepo := repository.NewFileRepository(db)

	// 4. Initialize Services
	oauthService := service.NewOAuthService(cfg, accountRepo)
	driveService := service.NewDriveService(cfg, accountRepo, fileRepo)
	storageService := service.NewStorageService(accountRepo, driveService)

	// 5. Initialize Handlers
	authHandler := handler.NewAuthHandler(oauthService)
	accountHandler := handler.NewAccountHandler(accountRepo, driveService)
	storageHandler := handler.NewStorageHandler(storageService)
	fileHandler := handler.NewFileHandler(fileRepo, accountRepo, driveService, storageService)

	// 6. Setup Gin Router
	r := gin.Default()

	// Enable CORS (Frontend friendly)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length", "Content-Disposition"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Swagger Interactive Documentation Route
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// API Routes Group
	api := r.Group("/api/v1")
	{
		// Health check
		api.GET("/ping", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status":    "healthy",
				"timestamp": time.Now().Format(time.RFC3339),
				"message":   "Google Drive Aggregator Backend is running smoothly",
			})
		})

		// Auth Routes (Google OAuth2)
		auth := api.Group("/auth")
		{
			auth.GET("/google/url", authHandler.GetAuthURL)
			auth.GET("/google/callback", authHandler.Callback)
		}

		// Account Management Routes
		accounts := api.Group("/accounts")
		{
			accounts.GET("", accountHandler.ListAccounts)
			accounts.GET("/:id", accountHandler.GetAccount)
			accounts.POST("/:id/sync", accountHandler.SyncAccount)
			accounts.DELETE("/:id", accountHandler.DeleteAccount)
		}

		// Aggregated Storage Routes
		storage := api.Group("/storage")
		{
			storage.GET("/overview", storageHandler.GetStorageOverview)
		}

		// File Management Routes
		files := api.Group("/files")
		{
			files.GET("", fileHandler.ListFiles)
			files.POST("/upload", fileHandler.UploadFile)
			files.GET("/download/:id", fileHandler.DownloadFile)
			files.DELETE("/:id", fileHandler.DeleteFile)
		}
	}

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("==================================================")
	log.Printf(" Google Drive Aggregator Server running on http://localhost%s", addr)
	log.Printf(" Interactive Swagger UI: http://localhost%s/swagger/index.html", addr)
	log.Printf("==================================================")

	if err := r.Run(addr); err != nil {
		log.Fatalf("Server gagal berjalan: %v", err)
	}
}

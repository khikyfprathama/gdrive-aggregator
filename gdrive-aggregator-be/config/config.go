package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/drive/v3"
)

type Config struct {
	Port               string
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	DBPath             string
	OAuth2Config       *oauth2.Config
}

var AppConfig *Config

func LoadConfig() *Config {
	// Load .env file if it exists, ignore error if missing (fallback to system env)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	port := getEnv("PORT", "8080")
	clientID := getEnv("GOOGLE_CLIENT_ID", "")
	clientSecret := getEnv("GOOGLE_CLIENT_SECRET", "")
	redirectURL := getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/v1/auth/google/callback")
	dbPath := getEnv("DB_PATH", "gdrive.db")

	oauthConfig := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
			drive.DriveScope, // full drive access to list, upload, and download
		},
		Endpoint: google.Endpoint,
	}

	AppConfig = &Config{
		Port:               port,
		GoogleClientID:     clientID,
		GoogleClientSecret: clientSecret,
		GoogleRedirectURL:  redirectURL,
		DBPath:             dbPath,
		OAuth2Config:       oauthConfig,
	}

	return AppConfig
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return defaultVal
}

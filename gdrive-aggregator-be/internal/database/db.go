package database

import (
	"log"

	"github.com/glebarez/sqlite"
	"gdrive-aggregator-be/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB(dbPath string) *gorm.DB {
	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("Gagal menghubungkan ke database SQLite: %v", err)
	}

	// Auto-migration tables
	err = DB.AutoMigrate(
		&model.Account{},
		&model.FileRecord{},
	)
	if err != nil {
		log.Fatalf("Gagal migrasi skema database: %v", err)
	}

	log.Println("Database SQLite berhasil diinisialisasi & dimigrasi.")
	return DB
}

package service

import (
	"context"
	"errors"
	"fmt"
	"sort"

	"gdrive-aggregator-be/internal/model"
	"gdrive-aggregator-be/internal/repository"
)

type StorageService interface {
	GetStorageOverview(ctx context.Context) (*model.StorageOverviewDTO, error)
	SelectOptimalAccountForUpload(ctx context.Context, fileSize int64) (*model.Account, error)
}

type storageService struct {
	accountRepo  repository.AccountRepository
	driveService DriveService
}

func NewStorageService(accountRepo repository.AccountRepository, driveService DriveService) StorageService {
	return &storageService{
		accountRepo:  accountRepo,
		driveService: driveService,
	}
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

func (s *storageService) GetStorageOverview(ctx context.Context) (*model.StorageOverviewDTO, error) {
	accounts, err := s.accountRepo.FindActive()
	if err != nil {
		return nil, err
	}

	var totalLimit, totalUsage, totalFree int64
	var accountsOverview []model.AccountSimpleDTO

	for _, acc := range accounts {
		free := acc.FreeStorage()
		totalLimit += acc.StorageLimit
		totalUsage += acc.StorageUsage
		totalFree += free

		var usagePct float64
		if acc.StorageLimit > 0 {
			usagePct = (float64(acc.StorageUsage) / float64(acc.StorageLimit)) * 100
		}

		accountsOverview = append(accountsOverview, model.AccountSimpleDTO{
			ID:              acc.ID,
			Email:           acc.Email,
			DisplayName:     acc.DisplayName,
			AvatarURL:       acc.AvatarURL,
			StorageLimit:    acc.StorageLimit,
			StorageUsage:    acc.StorageUsage,
			FreeStorage:     free,
			StorageLimitStr: formatBytes(acc.StorageLimit),
			StorageUsageStr: formatBytes(acc.StorageUsage),
			FreeStorageStr:  formatBytes(free),
			UsagePercent:    usagePct,
			IsActive:        acc.IsActive,
		})
	}

	var overallUsagePercentage float64
	if totalLimit > 0 {
		overallUsagePercentage = (float64(totalUsage) / float64(totalLimit)) * 100
	}

	return &model.StorageOverviewDTO{
		TotalLimitBytes:  totalLimit,
		TotalUsageBytes:  totalUsage,
		TotalFreeBytes:   totalFree,
		TotalLimitHuman:  formatBytes(totalLimit),
		TotalUsageHuman:  formatBytes(totalUsage),
		TotalFreeHuman:   formatBytes(totalFree),
		UsagePercentage:  overallUsagePercentage,
		AccountCount:     len(accounts),
		AccountsOverview: accountsOverview,
	}, nil
}

func (s *storageService) SelectOptimalAccountForUpload(ctx context.Context, fileSize int64) (*model.Account, error) {
	accounts, err := s.accountRepo.FindActive()
	if err != nil {
		return nil, err
	}

	if len(accounts) == 0 {
		return nil, errors.New("tidak ada akun Google Drive yang terhubung. Silakan hubungkan akun terlebih dahulu via OAuth")
	}

	// Filter accounts with enough free storage
	var candidateAccounts []model.Account
	for _, acc := range accounts {
		if acc.FreeStorage() >= fileSize {
			candidateAccounts = append(candidateAccounts, acc)
		}
	}

	if len(candidateAccounts) == 0 {
		return nil, fmt.Errorf("semua akun penuh atau tidak memiliki sisa ruang yang cukup untuk file berukuran %s", formatBytes(fileSize))
	}

	// Sort candidate accounts descending by free storage
	sort.Slice(candidateAccounts, func(i, j int) bool {
		return candidateAccounts[i].FreeStorage() > candidateAccounts[j].FreeStorage()
	})

	// Best account with largest free storage
	bestAccount := candidateAccounts[0]
	return &bestAccount, nil
}

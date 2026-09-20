# Google Drive Aggregator

A powerful and lightweight multi-account Google Drive aggregator with a Go backend and interactive Swagger UI.

Combine multiple Google Drive accounts into a unified storage pool, automatically allocate uploads to accounts with the most free space, and stream downloads with low memory footprint.

## Features

- **Multi-Account OAuth2**: Connect multiple Google Drive accounts with refresh token support.
- **Unified Storage Pool**: Overview of total, used, and free storage across all connected accounts.
- **Smart Upload Allocation**: Automatically picks the account with the largest available free quota when uploading files.
- **Streaming Upload & Download**: Low memory usage with direct stream proxying.
- **Interactive Swagger Documentation**: Test endpoints, check schemas, and upload files directly from the browser.
- **Pure-Go SQLite DB**: Fast, zero-config local metadata and token storage without CGO.

## Project Structure

```
gdrive-aggregator/
├── gdrive-aggregator-be/    # Golang backend (Gin, GORM, Swagger UI)
├── gdrive-aggregator-fe/    # Frontend dashboard (React / Vite)
├── .gitignore
└── README.md
```

## Getting Started (Backend)

1. Navigate to the backend directory:
   ```bash
   cd gdrive-aggregator-be
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Fill in your Google OAuth credentials in `.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URL` (default: `http://localhost:8080/api/v1/auth/google/callback`)

4. Run the server:
   ```bash
   go run ./cmd/server
   ```

5. Open the interactive Swagger UI:
   - **http://localhost:8080/swagger/index.html**

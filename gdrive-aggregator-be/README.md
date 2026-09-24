# Google Drive Aggregator - Backend (Go)

Backend ringan dan cepat berbasis Golang untuk mengagregasi beberapa akun Google Drive ke dalam satu pool penyimpanan terpusat, lengkap dengan dokumentasi interaktif **Swagger UI**.

---

## Fitur Utama

- **OAuth2 Multi-Akun**: Menghubungkan banyak akun Google Drive sekaligus via alur OAuth2 dengan offline access (`refresh_token`).
- **Smart Storage Allocator**: Secara otomatis memilih akun Google yang memiliki sisa kapasitas paling lega untuk menyimpan file baru.
- **Agregasi Storage Pool**: Menghitung total limit, total pemakaian, dan sisa storage di semua akun dalam satu ringkasan.
- **Streaming Upload & Download**: Pengunduhan dan pengunggahan biner dialirkan (*streamed*) langsung tanpa membebani disk atau RAM server backend.
- **Interactive Swagger UI**: Dokumentasi API interaktif lengkap dengan tombol *Try it out* dan form upload file langsung di browser.
- **Database Ringan**: Menggunakan SQLite Pure-Go (tanpa ketergantungan gcc/CGO).

---

## Persyaratan

- Go 1.22+ (atau otomatis Go 1.26 toolchain)
- Google Cloud OAuth 2.0 Credentials (Client ID & Client Secret)

---

## Konfigurasi Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru atau gunakan yang sudah ada.
3. Aktifkan **Google Drive API** di menu *APIs & Services > Library*.
4. Masuk ke *APIs & Services > OAuth consent screen*, atur Publishing status ke *Testing* dan tambahkan email pengujian Anda.
5. Masuk ke *APIs & Services > Credentials*, klik **Create Credentials > OAuth client ID**.
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:8080/api/v1/auth/google/callback`
6. Salin **Client ID** dan **Client Secret** ke file `.env`:
   ```env
   PORT=8080
   GOOGLE_CLIENT_ID=isi_client_id_anda.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=isi_client_secret_anda
   GOOGLE_REDIRECT_URL=http://localhost:8080/api/v1/auth/google/callback
   DB_PATH=gdrive.db
   ```

---

## Cara Menjalankan

### 1. Generate Dokumentasi Swagger
```bash
go run github.com/swaggo/swag/cmd/swag@v1.16.4 init -g cmd/server/main.go -o docs
```

### 2. Jalankan Server
```bash
go run ./cmd/server
```

Server akan aktif di:
- **API Base URL**: `http://localhost:8080/api/v1`
- **Swagger Interactive UI**: `http://localhost:8080/swagger/index.html`

---

## Daftar Endpoint API

### 1. Autentikasi Google (OAuth2)
- `GET /api/v1/auth/google/url` - Mengambil URL otorisasi login Google.
- `GET /api/v1/auth/google/callback` - Callback penukaran authorization code dengan token.

### 2. Akun Google
- `GET /api/v1/accounts` - Menampilkan daftar akun yang terhubung.
- `GET /api/v1/accounts/:id` - Menampilkan detail akun tertentu.
- `POST /api/v1/accounts/:id/sync` - Sinkronisasi ulang kuota akun dari Google Drive.
- `DELETE /api/v1/accounts/:id` - Memutuskan/menghapus akun dari aggregator.

### 3. Pool Penyimpanan (Storage)
- `GET /api/v1/storage/overview` - Ringkasan total storage, sisa storage gabungan, dan persentase penggunaan.

### 4. File Management
- `GET /api/v1/files` - Menampilkan daftar file dari seluruh akun (bisa filter per akun dan cari nama file).
- `POST /api/v1/files/upload` - Upload file (auto-alokasi ke akun paling lega jika `account_id` tidak diisi).
- `GET /api/v1/files/download/:id` - Stream download file langsung dari Google Drive ke pengguna.
- `DELETE /api/v1/files/:id` - Menghapus file dari Google Drive dan metadata lokal.

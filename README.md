# Drive Aggregator

> **Developed by [Garagarabug Studio](https://github.com/khikyfprathama)**

Sebuah agregator multi-akun Google Drive dengan backend Go dan antarmuka web interaktif. Gabungkan beberapa akun Google Drive menjadi satu pool penyimpanan terpusat, unggah file secara otomatis ke akun dengan ruang paling lega, dan streaming download dengan jejak memori yang ringan.

---

## ✨ Fitur Utama

- **Multi-Account OAuth2** — Hubungkan beberapa akun Google Drive dengan dukungan refresh token otomatis.
- **Unified Storage Pool** — Ringkasan total, terpakai, dan sisa penyimpanan dari semua akun.
- **Smart Upload Allocation** — Otomatis memilih akun dengan kuota bebas terbesar saat unggah file.
- **Navigasi Folder & Breadcrumbs** — Jelajahi struktur folder Google Drive secara langsung.
- **Thumbnail Preview** — Pratinjau gambar cepat via CDN thumbnail Google Drive (tanpa streaming full).
- **Multi-select & Batch Actions** — Pilih banyak file sekaligus untuk diunduh atau dihapus massal.
- **Detail File & Akun** — Info lengkap setiap file termasuk email akun Google Drive penyimpan.
- **Streaming Upload & Download** — Penggunaan memori rendah dengan stream proxy langsung.
- **Pure-Go SQLite DB** — Penyimpanan metadata lokal tanpa CGO, zero-config.
- **Swagger Interactive Docs** — Uji endpoint langsung dari browser.

---

## 🏗️ Struktur Proyek

```
gdrive-aggregator/
├── gdrive-aggregator-be/    # Golang backend (Gin, GORM, SQLite, Swagger)
├── gdrive-aggregator-fe/    # React + Vite frontend dashboard
├── LICENSE
└── README.md
```

---

## 🚀 Memulai (Backend)

1. Masuk ke direktori backend:
   ```bash
   cd gdrive-aggregator-be
   ```

2. Salin template environment:
   ```bash
   cp .env.example .env
   ```

3. Isi kredensial Google OAuth di `.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URL` (default: `http://localhost:8081/api/v1/auth/google/callback`)

4. Jalankan server:
   ```bash
   go run ./cmd/server
   # atau build dulu:
   go build -o server ./cmd/server && ./server
   ```

5. Buka Swagger UI:
   - **http://localhost:8081/swagger/index.html**

---

## 🖥️ Memulai (Frontend)

```bash
cd gdrive-aggregator-fe
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173` dan otomatis mendeteksi alamat backend dari hostname yang sama.

---

## 📄 Lisensi & Kredit

Proyek ini dilisensikan di bawah **MIT License with Attribution Requirement**.  
Lihat file [LICENSE](./LICENSE) untuk detail lengkap.

> **⚠️ Wajib Atribusi**: Setiap penggunaan, distribusi, atau modifikasi proyek ini — termasuk fork dan derivatif — **wajib** mencantumkan kredit:
>
> *"Drive Aggregator — originally developed by Garagarabug Studio"*
>
> Kredit harus tampil di UI aplikasi, README, dan repositori publik.

---

<div align="center">

Made with ☕ by **Garagarabug Studio**

*© 2024 Garagarabug Studio. All rights reserved.*

</div>

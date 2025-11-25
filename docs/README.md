# 📚 Dokumentasi Sistem Antrian

Selamat datang di dokumentasi lengkap **Aplikasi Loket Antrian Angkutan** untuk Dinas Perhubungan.

## 📖 Daftar Dokumentasi

### 1. [Cara Kerja Sistem](./cara-kerja-sistem.md)
**Panduan lengkap memahami sistem:**
- Arsitektur sistem
- Alur proses pengambilan dan pemanggilan antrian
- Komponen-komponen utama
- Teknologi yang digunakan
- Database schema dan relasi
- Real-time communication dengan Socket.io
- Security & authentication

### 2. [Setup Lokal](./setup-lokal.md)
**Panduan instalasi dan setup di komputer lokal:**
- Prerequisites (Node.js, PostgreSQL)
- Step-by-step instalasi
- Konfigurasi database
- Environment variables
- Menjalankan aplikasi
- Testing scenarios
- Troubleshooting common issues

### 3. [Deployment Production](./deployment.md)
**Panduan deploy ke server production:**
- Pilihan deployment (VPS, Docker, Vercel)
- Setup VPS dengan Nginx & PM2
- Docker deployment
- SSL certificate dengan Let's Encrypt
- Monitoring & maintenance
- Database backup strategy
- Security checklist

## 🚀 Quick Start

Untuk mulai development lokal:

```bash
# 1. Install dependencies
npm install

# 2. Setup database
npx prisma db push
npx prisma db seed

# 3. Run development server
npm run dev
```

Akses di http://localhost:3000

## 📋 Informasi Penting

### Login Credentials (Setelah Seed)
- **Admin**: `admin` / `admin123`
- **Petugas 1**: `petugas1` / `petugas123`
- **Petugas 2**: `petugas2` / `petugas123`
- **Petugas 3**: `petugas3` / `petugas123`

### Halaman Utama
- **Kiosk**: `/kiosk` - Pengambilan nomor antrian
- **Display**: `/display` - Layar tampilan publik
- **Loket**: `/loket` - Dashboard petugas
- **Admin**: `/admin` - Laporan & manajemen
- **Login**: `/login` - Halaman login

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: Socket.io
- **Auth**: JWT (jose) + Argon2

## 📞 Support

Jika ada pertanyaan atau masalah:
1. Check dokumentasi di folder `docs/`
2. Check section Troubleshooting di masing-masing guide
3. Open issue di repository (jika applicable)

## 📝 Update Log

- **v1.0.0** (2025-11-26): Initial release
  - Complete queue management system
  - Real-time updates dengan Socket.io
  - Multi-loket support (3 lokets)
  - Admin dashboard dengan reports
  - Authentication system

---

**Dibuat dengan ❤️ untuk Dinas Perhubungan**

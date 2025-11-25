# 🚀 Panduan Setup Lokal

## Prerequisites

### Software yang Diperlukan
- Node.js v20+
- **Database**: MySQL (XAMPP) atau PostgreSQL v14+
- npm atau yarn

> **✨ UPDATE**: Sistem sekarang support **MySQL dengan XAMPP**!  
> Lihat [MySQL Migration Guide](./mysql-migration.md) untuk detail.

## Instalasi

### 1. Install Dependencies
```bash
cd "/media/boba/DATA/Project/js project/react/Next.js/SFD-Antri"
npm install
```

### 2. Setup Database

**Pilihan A: MySQL dengan XAMPP (Recommended)**

1. Install dan start XAMPP
2. Buka phpMyAdmin: http://localhost/phpmyadmin
3. Create database: `antrian_db`

**Pilihan B: PostgreSQL**

**Start PostgreSQL:**
```bash
# Ubuntu/Debian
sudo systemctl start postgresql

# macOS
brew services start postgresql@14
```

**Create Database:**
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE antrian_db;
\q
```

### 3. Konfigurasi Environment

File `.env` sudah ada, sesuaikan jika perlu:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/antrian_db"
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this
```

### 4. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema ke database
npx prisma db push

# Seed database dengan data demo
npx prisma db seed
```

**Login credentials setelah seed:**
- Admin: `admin` / `admin123`
- Petugas: `petugas1` / `petugas123`

### 5. Run Development Server

```bash
npm run dev
```

Akses aplikasi di http://localhost:3000

## Halaman Utama

- **Kiosk**: http://localhost:3000/kiosk
- **Display**: http://localhost:3000/display  
- **Loket**: http://localhost:3000/loket
- **Admin**: http://localhost:3000/admin
- **Login**: http://localhost:3000/login

## Testing

### Test 1: Ambil Nomor Antrian
1. Buka `/kiosk`
2. Klik "Angkutan Umum"
3. Lihat nomor antrian muncul (misal: U-001)

### Test 2: Panggil Antrian
1. Login di `/login` dengan `petugas1` / `petugas123`
2. Klik "Panggil Berikutnya"
3. Buka `/display` di tab lain
4. Lihat nomor muncul dan audio berbunyi

### Test 3: Lihat Laporan
1. Login sebagai `admin` / `admin123`
2. Pilih tanggal hari ini
3. Klik "Tampilkan Laporan"

## Troubleshooting

### Port 3000 sudah digunakan
Edit `.env` dan ganti `PORT=3001`

### Database connection error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Socket.io tidak connect
Pastikan menggunakan `npm run dev`, bukan `npx next dev`

### Audio tidak keluar
- Click di halaman Display untuk enable audio
- Check browser permission untuk autoplay

## Development Tools

**Prisma Studio** (Database GUI):
```bash
npx prisma studio
```
Akses di http://localhost:5555

**Reset Database:**
```bash
npx prisma db push --force-reset
npx prisma db seed
```

## Script Commands

```bash
npm run dev              # Start dev server
npm run build            # Build production
npm start                # Run production
npm run lint             # Run linter
npm run prisma:generate  # Generate Prisma Client
npm run prisma:push      # Push schema to DB
npm run prisma:studio    # Open Prisma Studio
```

## Tips

1. **Multiple Terminals:**
   - Terminal 1: `npm run dev`
   - Terminal 2: `npx prisma studio`

2. **Browser DevTools:**
   - Console: Socket.io logs
   - Network: API calls

3. **Hot Reload:**
   - Changes di `src/app` → auto reload
   - Changes di `server.ts` → restart manual

Untuk deployment production, lihat [Deployment Guide](./deployment.md)

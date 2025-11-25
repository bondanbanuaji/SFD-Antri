# ✅ Checklist Setup MySQL XAMPP

Gunakan checklist ini untuk memastikan setup berjalan lancar.

## Prerequisites

- [ ] XAMPP terinstall
- [ ] Node.js v20+ terinstall
- [ ] Git (jika clone dari repo)

## Setup XAMPP

- [ ] Start XAMPP Control Panel
- [ ] Start service **Apache**
- [ ] Start service **MySQL**
- [ ] Verify MySQL running (hijau di control panel)
- [ ] Akses phpMyAdmin: http://localhost/phpmyadmin

## Create Database

- [ ] Buka phpMyAdmin
- [ ] Click tab "Databases"
- [ ] Database name: `antrian_db`
- [ ] Collation: `utf8mb4_general_ci`
- [ ] Click "Create"
- [ ] Verify database `antrian_db` muncul di sidebar

## Setup Project

- [ ] Navigate ke folder project
- [ ] Run: `npm install`
- [ ] Wait untuk instalasi selesai
- [ ] Check file `.env` sudah ada
- [ ] Verify DATABASE_URL: `mysql://root:@localhost:3306/antrian_db`

## Database Migration

- [ ] Run: `npx prisma generate`
- [ ] Check output: "✔ Generated Prisma Client"
- [ ] Run: `npx prisma db push`
- [ ] Check tables created di phpMyAdmin (User, Loket, Queue)
- [ ] Run: `npx prisma db seed`
- [ ] Check data seeded (4 users, 3 lokets, 3 queues)

## Verify di phpMyAdmin

- [ ] Buka database `antrian_db`
- [ ] Check table `User`: 4 rows
- [ ] Check table `Loket`: 3 rows
- [ ] Check table `Queue`: 3 rows
- [ ] Check ada user `admin`
- [ ] Check ada user `petugas1`, `petugas2`, `petugas3`

## Run Application

- [ ] Run: `npm run dev`
- [ ] Wait server start
- [ ] Check output: "Ready on http://localhost:3000"
- [ ] Check: "Socket.io server initialized"

## Test Application

- [ ] Buka browser: http://localhost:3000
- [ ] Homepage load dengan baik
- [ ] Click link "Kiosk" → Load
- [ ] Click "Angkutan Umum" → Dapat nomor antrian
- [ ] Buka tab baru: http://localhost:3000/login
- [ ] Login: `petugas1` / `petugas123`
- [ ] Redirect ke `/loket`
- [ ] Click "Panggil Berikutnya" → Works
- [ ] Buka tab baru: http://localhost:3000/display
- [ ] Nomor muncul di display
- [ ] Audio berbunyi (check volume)

## Troubleshooting Checklist

### XAMPP Issues

- [ ] Port 3306 tidak digunakan aplikasi lain
- [ ] MySQL service hijau di control panel
- [ ] Tidak ada error di MySQL logs

### Database Issues

- [ ] Database `antrian_db` exist
- [ ] Tables created (User, Loket, Queue)
- [ ] User root bisa connect
- [ ] Seeded data ada

### Application Issues

- [ ] `node_modules` terinstall
- [ ] `.env` file ada
- [ ] DATABASE_URL correct
- [ ] Port 3000 tidak digunakan
- [ ] No error di terminal

## Common Errors & Solutions

### ❌ "Can't connect to MySQL server"

**Solusi:**
- [ ] Check XAMPP MySQL running
- [ ] Check port 3306 di `.env`
- [ ] Restart MySQL di XAMPP

### ❌ "Access denied for user 'root'"

**Solusi:**
- [ ] Check password di `.env`
- [ ] Default XAMPP: no password (kosong)
- [ ] Format: `mysql://root:@localhost:3306/antrian_db`

### ❌ "Database 'antrian_db' does not exist"

**Solusi:**
- [ ] Buka phpMyAdmin
- [ ] Create database manual
- [ ] Run `npx prisma db push` lagi

### ❌ "Port 3000 already in use"

**Solusi:**
- [ ] Stop aplikasi lain di port 3000
- [ ] Atau ganti port di `.env`: `PORT=3001`

## Success Indicators

✅ **Database:**
- phpMyAdmin shows `antrian_db` with 3 tables
- 4 users exist (1 admin, 3 petugas)
- 3 lokets exist
- Sample queues exist

✅ **Application:**
- Homepage loads without errors
- Can take queue number at Kiosk
- Can login as petugas
- Can call queue at Loket
- Display shows called queue
- Audio plays

✅ **Developer Tools:**
- No console errors
- Socket.io connected
- API calls successful (200 status)

## Next Steps After Setup

1. **Customize Configuration**
   - [ ] Change JWT_SECRET di `.env`
   - [ ] Set production database credentials
   - [ ] Configure audio settings

2. **Add More Data**
   - [ ] Create more test queues
   - [ ] Test with heavy load
   - [ ] Check performance

3. **Deploy to Production**
   - [ ] Follow deployment guide
   - [ ] Setup production database
   - [ ] Configure SSL if public

## Support

Jika ada masalah setelah checklist ini:

1. Read: [MySQL Migration Guide](./mysql-migration.md)
2. Read: [Setup Lokal](./setup-lokal.md)
3. Check XAMPP logs: `C:\xampp\mysql\data\mysql_error.log`
4. Check application logs di terminal

---

**Setup complete! Aplikasi siap digunakan dengan MySQL XAMPP! 🎉**

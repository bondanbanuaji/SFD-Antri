# Panduan Lengkap Setup Lokal (Zero to Hero)

Panduan ini akan menuntun Anda dari **NOL** (belum punya aplikasi) sampai aplikasi bisa jalan dan dipakai simulasi (Kiosk, Display, Loket) di jaringan lokal Anda.

Panduan ini mencakup cara instalasi untuk **Windows**, **macOS**, dan **Linux**.

---

## BAB 1: Persiapan Software (Wajib)

Sebelum download aplikasi, pastikan komputer Anda sudah terinstall alat-alat berikut.

### 🪟 Pengguna Windows
1.  **Install Node.js**:
    *   Download versi **LTS** di [nodejs.org](https://nodejs.org/).
    *   Install seperti biasa (Next > Next > Finish).
2.  **Install Git**:
    *   Download di [git-scm.com](https://git-scm.com/download/win).
    *   Install dengan pengaturan default.
3.  **Install Database (XAMPP)**:
    *   Download XAMPP di [apachefriends.org](https://www.apachefriends.org/).
    *   Install dan jalankan **XAMPP Control Panel**.
    *   Klik **Start** pada bagian **MySQL**.

### 🍎 Pengguna macOS
1.  **Install Homebrew** (jika belum ada):
    *   Buka Terminal, copy-paste perintah dari [brew.sh](https://brew.sh/).
2.  **Install Node.js & Git**:
    ```bash
    brew install node git
    ```
3.  **Install MySQL**:
    *   Bisa pakai [DBngin](https://dbngin.com/) (lebih mudah) atau `brew install mysql`.
    *   Pastikan service database sudah jalan.

### 🐧 Pengguna Linux (Ubuntu/Debian)
Buka Terminal dan jalankan:
```bash
# Update repository
sudo apt update

# Install Node.js (via NVM disarankan, atau langsung apt)
sudo apt install nodejs npm git -y

# Install MySQL/MariaDB
sudo apt install mariadb-server -y
sudo service mysql start
```

---

## BAB 2: Download & Instalasi Aplikasi

Lakukan langkah ini di **Terminal** (Mac/Linux) atau **Command Prompt/PowerShell** (Windows).

### 1. Clone (Download) Kode Program
Masuk ke folder dimana Anda ingin menyimpan proyek ini, lalu ketik:

```bash
https://github.com/bondanbanuaji/SFD-Antri.git
cd SFD-Antri
```
*(Ganti URL git dengan link repository proyek ini)*

### 2. Install Dependencies
Perintah ini akan mendownload semua "bahan baku" aplikasi. Pastikan ada internet.

```bash
npm install
```
*Tunggu sampai selesai (muncul tulisan "added ... packages").*

---

## BAB 3: Konfigurasi Database & Jaringan

Ini langkah paling penting agar aplikasi bisa jalan dan diakses HP lain.

### 1. Siapkan Database
*   Buka aplikasi database manager (phpMyAdmin di `http://localhost/phpmyadmin` atau DBeaver).
*   Buat database baru dengan nama: `antrian_db`.

### 2. Cari Tahu IP Address Komputer Anda
Agar HP atau laptop lain bisa akses, kita butuh alamat IP komputer ini.

*   **Windows**: Ketik `ipconfig` di CMD. Cari **IPv4 Address**. (Contoh: `192.168.1.10`)
*   **Mac/Linux**: Ketik `ifconfig` atau `ip a` di Terminal. Cari angka `inet` (biasanya `192.168.x.x`).

### 3. Setting File `.env`
1.  Copy file `example .env copy` dan ubah namanya jadi `.env`.
2.  Buka file `.env` dengan text editor (Notepad/VS Code).
3.  Ubah isinya seperti ini:

```env
# DATABASE: Sesuaikan user & password database Anda
# Jika XAMPP default: user=root, password kosong
DATABASE_URL="mysql://root:@localhost:3306/antrian_db"

# APP URL: GANTI 'localhost' dengan IP Address yang tadi dicatat!
# Contoh jika IP Anda 192.168.1.10:
NEXT_PUBLIC_APP_URL=http://192.168.1.10:3000

# Lainnya biarkan default
NODE_ENV=development
JWT_SECRET=rahasia-dapur
```

### 4. Isi Database (Migration & Seed)
Kembali ke Terminal/CMD, jalankan perintah ini satu per satu:

```bash
# Membuat tabel-tabel otomatis
npx prisma migrate deploy

# Mengisi data awal (Admin & Loket)
npx prisma db seed
```
*Jika sukses, akan muncul pesan "Seeding finished".*

---

## BAB 4: Menjalankan Aplikasi

Sekarang saatnya menyalakan mesin!

### Jalankan Server
Di Terminal/CMD, ketik:

```bash
npm run dev
```

Tunggu sampai muncul tulisan:
```
   Local:    http://localhost:3000
   Network:  http://192.168.1.10:3000  <-- INI ALAMAT PENTING
```

---

## BAB 5: Simulasi Penggunaan (Skenario Real)

Sekarang sistem sudah jalan. Mari kita simulasikan seperti di kantor/klinik asli.
**Syarat: Semua perangkat harus konek ke Wi-Fi yang sama.**

### 🖥️ Perangkat 1: Laptop Server (Admin & Loket)
Laptop ini yang menjalankan `npm run dev` tadi. Jangan tutup terminalnya!
1.  Buka Browser (Chrome).
2.  Buka `http://localhost:3000/login`.
3.  Login sebagai **Petugas** (User: `petugas1`, Pass: `password`).
4.  Standby di halaman Loket.

### 📱 Perangkat 2: HP Pengunjung (Kiosk)
1.  Buka Browser di HP (Chrome/Safari).
2.  Ketik alamat Network tadi: `http://192.168.1.10:3000` (Sesuaikan IP).
3.  Pilih menu "Ambil Antrian".
4.  Coba ambil satu tiket.
    *   *Hasil*: Di HP muncul tiket, di Laptop Server (Loket) antrian bertambah otomatis!

### 📺 Perangkat 3: Smart TV / Laptop Kedua (Display)
1.  Buka Browser.
2.  Ketik: `http://192.168.1.10:3000/display`.
3.  Tampilan layar besar antrian muncul.
4.  **Tes Panggil**:
    *   Di Laptop Server (Loket), tekan tombol "Panggil".
    *   *Hasil*: Di Perangkat 3 (Display) akan muncul notifikasi besar dan suara "Nomor Antrian... Silakan ke Loket...".

---

## Troubleshooting (Masalah Umum)

**Q: HP tidak bisa buka alamatnya (Loading terus/Error)?**
*   **Windows**: Matikan Firewall sebentar. (Search "Firewall & network protection" > Private network > Off).
*   **Jaringan**: Pastikan HP tidak pakai Data Seluler, harus Wi-Fi yang sama dengan Laptop.

**Q: Error "Prisma Client could not initialize"?**
*   Cek apakah XAMPP/MySQL sudah distart?
*   Cek apakah password di `.env` sudah benar?

**Q: Tidak ada suara saat dipanggil?**
*   Browser memblokir suara otomatis (Autoplay Policy).
*   Klik sembarang tempat di halaman Display minimal sekali agar browser mengizinkan suara.

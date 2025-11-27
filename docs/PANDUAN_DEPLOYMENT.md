# Panduan Deployment SFD-Antri

Panduan ini menjelaskan cara menginstal dan menjalankan aplikasi SFD-Antri di server produksi atau komputer lokal. Panduan ini mencakup instruksi untuk **Windows**, **Linux (Ubuntu/Debian)**, dan **macOS**.

## 1. Persyaratan Sistem (Prerequisites)

Sebelum memulai, pastikan perangkat Anda sudah terinstall software berikut:

1.  **Node.js** (Versi 18 atau lebih baru)
    *   *Cek versi*: `node -v`
    *   *Download*: [nodejs.org](https://nodejs.org/)
2.  **MySQL Database** (Versi 8.0 atau MariaDB)
    *   Bisa menggunakan XAMPP (Windows/Mac) atau install manual.
3.  **Git** (Untuk mengunduh kode program)
    *   *Cek versi*: `git --version`

---

## 2. Konfigurasi Database & Environment

### Langkah 1: Siapkan Database
1.  Buka aplikasi manajemen database Anda (phpMyAdmin, DBeaver, atau Terminal).
2.  Buat database baru dengan nama `antrian_db` (atau nama lain sesuai keinginan).

### Langkah 2: Konfigurasi .env
1.  Duplikasi file `example .env copy` menjadi `.env`.
    *   **Windows**: Copy paste file biasa, lalu rename.
    *   **Terminal**: `cp "example .env copy" .env`
2.  Buka file `.env` dengan text editor (Notepad, VS Code, Nano).
3.  Edit bagian `DATABASE_URL` sesuai settingan database Anda.

**Format URL Database:**
`mysql://USER:PASSWORD@HOST:PORT/NAMA_DATABASE`

**Contoh Konfigurasi:**

*   **XAMPP (Windows/Mac) - Default tanpa password:**
    ```env
    DATABASE_URL="mysql://root:@localhost:3306/antrian_db"
    ```

*   **Linux / Server Production (dengan password):**
    ```env
    DATABASE_URL="mysql://root:password_rahasia@localhost:3306/antrian_db"
    ```

### Langkah 3: Sinkronisasi Database (Migration)
Jalankan perintah ini untuk membuat tabel-tabel otomatis di database Anda:

```bash
npx prisma migrate deploy
```
*Jika sukses, akan muncul pesan "The schema engine has successfully applied the following migrations..."*

### Langkah 4: Seeding (Isi Data Awal)
Untuk mengisi database dengan user admin default dan loket awal:

```bash
npx prisma db seed
```

---

## 3. Menjalankan Aplikasi

### Mode Development (Untuk Percobaan/Edit)
Gunakan mode ini jika Anda ingin mengubah kodingan atau sekedar mencoba di laptop.
```bash
npm run dev
```
Akses di browser: `http://localhost:3000`

### Mode Production (Untuk Server/Pemakaian Asli)
Gunakan mode ini untuk performa terbaik dan stabil.

1.  **Build Aplikasi** (Lakukan ini setiap ada perubahan kode):
    ```bash
    npm run build
    ```

2.  **Jalankan Server**:
    ```bash
    npm start
    ```
    Akses di browser: `http://localhost:3000`

---

## 4. Menjalankan di Background (Opsional tapi Disarankan)

Agar aplikasi tetap jalan meskipun terminal ditutup (khususnya di Server Linux/VPS), gunakan **PM2**.

1.  **Install PM2**:
    ```bash
    npm install -g pm2
    ```

2.  **Jalankan Aplikasi dengan PM2**:
    ```bash
    pm2 start npm --name "sfd-antri" -- start
    ```

3.  **Cek Status**:
    ```bash
    pm2 status
    ```

4.  **Agar Otomatis Jalan saat Restart Server**:
    ```bash
    pm2 startup
    pm2 save
    ```

---

## 5. Catatan Khusus per OS

### 🪟 Windows
*   Jika menggunakan **XAMPP**, pastikan tombol "Start" pada MySQL sudah diklik di XAMPP Control Panel.
*   Jika perintah `npm` atau `git` tidak dikenali, pastikan Anda sudah menambahkannya ke "Environment Variables" Windows atau restart komputer setelah install.

### 🐧 Linux (Ubuntu/Debian)
*   Jika ada error "Permission denied", gunakan `sudo` di depan perintah (kecuali `npm install`).
*   Pastikan port 3000 sudah dibuka di firewall jika ingin diakses dari luar:
    ```bash
    sudo ufw allow 3000
    ```

### 🍎 macOS
*   Jika menggunakan MySQL native, pastikan service sudah jalan.
*   Perintah terminal sama persis dengan Linux.

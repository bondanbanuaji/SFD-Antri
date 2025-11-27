# Cara Kerja Sistem SFD-Antri

Dokumen ini menjelaskan bagaimana sistem antrian SFD-Antri bekerja secara teknis maupun fungsional. Panduan ini ditujukan untuk pengembang atau administrator yang ingin memahami arsitektur di balik layar.

## 1. Pengenalan Sistem

**SFD-Antri** adalah sistem manajemen antrian berbasis web yang modern dan responsif. Sistem ini dirancang untuk menangani antrian di berbagai layanan (seperti rumah sakit, bank, atau kantor pelayanan publik) dengan fitur *real-time* yang memastikan semua perangkat terhubung secara instan.

### Komponen Utama:
1.  **Kiosk (Anjungan Mandiri)**: Tempat pengunjung mengambil nomor antrian (bisa via layar sentuh atau HP).
2.  **Display (Layar Utama)**: Layar besar yang menampilkan nomor antrian yang sedang dipanggil beserta video/informasi lainnya.
3.  **Loket (Petugas)**: Dashboard untuk petugas memanggil, melewati, atau menyelesaikan antrian.
4.  **Admin**: Dashboard untuk manajemen user, konfigurasi loket, dan melihat laporan.
5.  **Server**: Otak dari sistem yang menghubungkan semua komponen di atas.

---

## 2. Arsitektur Teknologi

Sistem ini dibangun menggunakan teknologi web modern yang cepat dan efisien:

*   **Next.js (React Framework)**: Digunakan untuk membuat tampilan antarmuka (Frontend) dan logika server (Backend API). Next.js membuat aplikasi terasa cepat dan responsif.
*   **Socket.io (WebSocket)**: Teknologi kunci untuk fitur **Real-time**. Ini memungkinkan server mengirim data ke Display atau Loket secara instan tanpa perlu refresh halaman. Contoh: Saat petugas menekan "Panggil", layar Display langsung berubah detik itu juga.
*   **Prisma (ORM)**: Alat untuk berkomunikasi dengan database. Memudahkan pengelolaan data antrian, user, dan loket.
*   **MySQL (Database)**: Tempat penyimpanan data permanen. Semua riwayat antrian, data user, dan konfigurasi tersimpan di sini.
*   **Tailwind CSS**: Framework desain untuk membuat tampilan yang cantik, rapi, dan responsif di HP maupun Desktop.

---

## 3. Alur Data (Data Flow)

Berikut adalah perjalanan data dari pengunjung datang hingga selesai dilayani:

### Tahap 1: Pengambilan Antrian (Kiosk)
1.  Pengunjung datang ke **Kiosk** atau scan QR Code.
2.  Pengunjung memilih layanan (misal: Layanan Umum atau Barang).
3.  **Kiosk** mengirim permintaan ke **Server**.
4.  **Server** membuat nomor antrian baru di **Database** (misal: A-001).
5.  **Server** memberitahu **Kiosk** untuk mencetak/menampilkan nomor tiket.
6.  *Secara bersamaan*, **Server** mengirim sinyal ke dashboard **Loket** dan **Admin** bahwa ada antrian baru yang menunggu.

### Tahap 2: Pemanggilan (Loket)
1.  Petugas di **Loket** melihat daftar antrian yang menunggu.
2.  Petugas menekan tombol **"Panggil Berikutnya"**.
3.  **Loket** mengirim perintah ke **Server**.
4.  **Server** memperbarui status antrian menjadi "CALLED" di **Database**.
5.  **Server** memancarkan sinyal (Broadcast) ke seluruh sistem:
    *   **Display**: Langsung menampilkan nomor A-001 dengan animasi berkedip dan memutar suara panggilan ("Nomor Antrian A, Kosong, Kosong, Satu, Silakan ke Loket Satu").
    *   **Loket Lain**: Daftar antrian diperbarui agar tidak ada petugas lain yang memanggil nomor yang sama.

### Tahap 3: Pelayanan & Penyelesaian
1.  Setelah pelayanan selesai, petugas menekan **"Selesai"**.
2.  Status antrian diubah menjadi "COMPLETED".
3.  Data disimpan sebagai riwayat untuk laporan harian.
4.  Petugas siap memanggil antrian berikutnya.

---

## 4. Struktur Database

Sistem menggunakan beberapa tabel utama untuk menyimpan data:

### Tabel `User`
Menyimpan data pengguna sistem (Admin dan Petugas Loket).
*   `username`: Nama login.
*   `password`: Kata sandi (dienkripsi agar aman).
*   `role`: Peran user (ADMIN atau PETUGAS).

### Tabel `Loket`
Menyimpan konfigurasi loket pelayanan.
*   `name`: Nama loket (contoh: "Loket 1", "Customer Service").
*   `status`: Status loket (Buka, Tutup, Istirahat).
*   `userId`: Petugas yang sedang menjaga loket tersebut.

### Tabel `Queue` (Antrian)
Tabel paling sibuk yang mencatat setiap tiket antrian.
*   `number`: Urutan angka (1, 2, 3...).
*   `code`: Kode lengkap (A-001).
*   `type`: Jenis layanan.
*   `status`: Status saat ini (WAITING, CALLED, COMPLETED, SKIPPED).
*   `timestamps`: Waktu ambil, waktu panggil, dan waktu selesai (untuk menghitung durasi pelayanan).

---

## 5. Keamanan & Kestabilan

*   **Enkripsi Password**: Password tidak disimpan mentah, tapi diacak menggunakan algoritma Argon2/Bcrypt sehingga aman dari peretas.
*   **Validasi Data**: Setiap input dari user diperiksa (validasi) untuk mencegah error atau data sampah masuk ke sistem.
*   **Koneksi Database**: Menggunakan *Connection Pooling* untuk menangani banyak permintaan sekaligus tanpa membuat database macet.

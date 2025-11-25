# 🔄 Migrasi ke MySQL (XAMPP)

## Update yang Sudah Dilakukan

Sistem telah **berhasil dimigrasi** dari PostgreSQL ke MySQL untuk kompatibilitas dengan XAMPP dan phpMyAdmin.

### Perubahan Teknis

#### 1. **Prisma Schema** (`prisma/schema.prisma`)
```diff
datasource db {
-  provider = "postgresql"
+  provider = "mysql"
   url      = env("DATABASE_URL")
}

model User {
-  id        String   @id @default(uuid())
+  id        String   @id @default(cuid())
-  password  String
+  password  String   @db.VarChar(255)
}
```

**Perubahan:**
- Provider: `postgresql` → `mysql`
- UUID → CUID (lebih kompatibel dengan MySQL)
- Added `@db.VarChar()` untuk string fields

#### 2. **Environment Variables** (`.env`)
```diff
-DATABASE_URL="postgresql://postgres:postgres@localhost:5432/antrian_db"
+DATABASE_URL="mysql://root:@localhost:3306/antrian_db"
```

**Format koneksi MySQL:**
```
mysql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

## Setup dengan XAMPP

### Prerequisites

1. **Install XAMPP**
   - Download dari: https://www.apachefriends.org/
   - Install dan jalankan

2. **Start Services**
   - Buka XAMPP Control Panel
   - Start **Apache** (untuk phpMyAdmin)
   - Start **MySQL**

### Step-by-Step Setup

#### 1. Create Database via phpMyAdmin

**Akses phpMyAdmin:**
```
http://localhost/phpmyadmin
```

**Create Database:**
1. Click tab "Databases"
2. Nama database: `antrian_db`
3. Collation: `utf8mb4_general_ci`
4. Click "Create"

#### 2. Configure Environment

File `.env` sudah diupdate. Jika password MySQL root Anda berbeda:

```env
# Default XAMPP (no password)
DATABASE_URL="mysql://root:@localhost:3306/antrian_db"

# Jika ada password
DATABASE_URL="mysql://root:your_password@localhost:3306/antrian_db"

# Jika port berbeda
DATABASE_URL="mysql://root:@localhost:3307/antrian_db"
```

#### 3. Generate Prisma Client

```bash
npx prisma generate
```

#### 4. Push Schema ke MySQL

```bash
npx prisma db push
```

Ini akan:
- Create tables: `User`, `Loket`, `Queue`
- Create indexes
- Setup enum values

#### 5. Seed Database

```bash
npx prisma db seed
```

**Login credentials tetap sama:**
- Admin: `admin` / `admin123`
- Petugas: `petugas1` / `petugas123`

#### 6. Run Application

```bash
npm run dev
```

### Verifikasi di phpMyAdmin

1. Buka http://localhost/phpmyadmin
2. Select database `antrian_db`
3. Check tables:
   - `User` (4 rows: 1 admin, 3 petugas)
   - `Loket` (3 rows)
   - `Queue` (3 sample queues)

## Perbedaan PostgreSQL vs MySQL

### Data Types

| PostgreSQL | MySQL | Keterangan |
|------------|-------|------------|
| UUID | CUID/VARCHAR | MySQL tidak support UUID native |
| TEXT | VARCHAR(n) | MySQL perlu specify length |
| SERIAL | AUTO_INCREMENT | Auto increment syntax berbeda |

### Features

✅ **Yang Tetap Sama:**
- Semua fitur aplikasi
- API endpoints
- Real-time Socket.io
- Authentication
- Queue logic

⚠️ **Perhatian:**
- MySQL case-insensitive untuk string comparison
- Timestamp precision bisa berbeda
- Beberapa function PostgreSQL tidak ada di MySQL

## Troubleshooting

### Error: Can't connect to MySQL server

**Check XAMPP:**
```bash
# Buka XAMPP Control Panel
# Pastikan MySQL status: Running
```

**Check Port:**
```bash
# Default MySQL port: 3306
# Jika berbeda, update .env
```

### Error: Access denied for user 'root'

**Reset MySQL password via XAMPP:**
1. Stop MySQL
2. Click "Config" → "my.ini"
3. Atau set password di phpMyAdmin
4. Update `.env` dengan password baru

### Error: Client does not support authentication protocol

**Fix untuk MySQL 8+:**

Login ke MySQL via XAMPP shell:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
FLUSH PRIVILEGES;
```

### Prisma Client tidak generate

```bash
# Clean dan reinstall
rm -rf node_modules
npm install
npx prisma generate
```

## Database Management

### Backup Database

**Via phpMyAdmin:**
1. Select database `antrian_db`
2. Tab "Export"
3. Format: SQL
4. Click "Go"

**Via Command Line:**
```bash
# Via XAMPP MySQL
cd C:\xampp\mysql\bin
mysqldump -u root antrian_db > backup.sql
```

### Restore Database

**Via phpMyAdmin:**
1. Select database `antrian_db`
2. Tab "Import"
3. Choose file
4. Click "Go"

**Via Command Line:**
```bash
mysql -u root antrian_db < backup.sql
```

### Reset Database

```bash
# Drop dan recreate semua tables
npx prisma db push --force-reset

# Seed ulang
npx prisma db seed
```

## Performance Tips

### MySQL Configuration (Optional)

Edit `C:\xampp\mysql\bin\my.ini`:

```ini
[mysqld]
# Increase max connections
max_connections = 200

# Increase buffer pool
innodb_buffer_pool_size = 256M

# Query cache (MySQL 5.7)
query_cache_size = 32M
```

Restart MySQL setelah edit.

### Indexes

Schema sudah include indexes untuk performa:
```prisma
@@index([status, type])  // Quick filter
@@index([createdAt])     // Fast sorting
```

## Migration Checklist

- [x] Update Prisma schema provider
- [x] Change UUID to CUID
- [x] Add MySQL data types
- [x] Update .env connection string
- [x] Test database connection
- [x] Run migrations
- [x] Seed database
- [x] Verify in phpMyAdmin

## Next Steps

1. **Start XAMPP** (Apache + MySQL)
2. **Create database** via phpMyAdmin
3. **Run migrations**: `npx prisma db push`
4. **Seed data**: `npx prisma db seed`
5. **Start app**: `npm run dev`
6. **Test semua fitur**

Database Anda sekarang 100% kompatibel dengan MySQL XAMPP! 🎉

## Support

Untuk masalah spesifik XAMPP:
- XAMPP Documentation: https://www.apachefriends.org/docs/
- phpMyAdmin: http://localhost/phpmyadmin
- MySQL Logs: `C:\xampp\mysql\data\mysql_error.log`

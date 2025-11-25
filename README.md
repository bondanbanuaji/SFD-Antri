# Aplikasi Loket Antrian Angkutan

Sistem antrian digital berbasis web untuk Dinas Perhubungan dengan dukungan multi-loket dan real-time updates.

## 🚀 Features

- ✅ **Kiosk System** - Pengambilan nomor antrian untuk Angkutan Umum dan Angkutan Barang
- ✅ **Real-time Display** - Layar tampilan antrian dengan Socket.io
- ✅ **Loket Dashboard** - Interface petugas untuk memanggil dan mengelola antrian
- ✅ **Admin Dashboard** - Laporan statistik dan manajemen sistem
- ✅ **Authentication** - JWT-based authentication dengan Argon2 password hashing
- ✅ **Real-time Communication** - WebSocket menggunakan Socket.io
- ✅ **Audio Announcements** - Browser TTS untuk panggilan antrian
- ✅ **MySQL Support** - Compatible dengan XAMPP dan phpMyAdmin

> **✨ NEW**: Sistem sekarang **100% compatible dengan MySQL**!  
> Cocok untuk deployment dengan XAMPP. Lihat [MySQL Migration Guide](./docs/mysql-migration.md)

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Database**: MySQL (XAMPP) / PostgreSQL + Prisma ORM
- **Real-time**: Socket.io
- **Authentication**: JWT (jose) + Argon2

## 📦 Installation

### Prerequisites

- Node.js 20+
- **MySQL** (via XAMPP) **or** PostgreSQL 14+
- npm or yarn

### Setup MySQL dengan XAMPP

1. **Install XAMPP** dan start MySQL service
2. **Buka phpMyAdmin**: http://localhost/phpmyadmin
3. **Create database**: `antrian_db`

Untuk panduan lengkap, lihat [MySQL Migration Guide](./docs/mysql-migration.md)

## 📦 Installation

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Steps

1. **Clone the repository** (if from git)
   ```bash
   cd /media/boba/DATA/Project/js project/react/Next.js/SFD-Antri
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Database**
   
   **Option A: MySQL dengan XAMPP (Recommended)**
   
   - Start XAMPP MySQL service
   - Create database via phpMyAdmin:
   ```sql
   CREATE DATABASE antrian_db;
   ```
   
   **Option B: PostgreSQL**
   
   Create a PostgreSQL database:
   ```sql
   CREATE DATABASE antrian_db;
   ```

4. **Configure Environment**
   
   The `.env` file is pre-configured for MySQL/XAMPP. Update if needed:
   ```env
   # MySQL (XAMPP default)
   DATABASE_URL="mysql://root:@localhost:3306/antrian_db"
   
   # Or PostgreSQL
   # DATABASE_URL="postgresql://postgres:postgres@localhost:5432/antrian_db"
   
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

5. **Run Database Migrations**
   ```bash
   npm run prisma:push
   ```

6. **Seed Database**
   ```bash
   npx prisma db seed
   ```

7. **Start Development Server**
   ```bash
   npm run dev
   ```

8. **Access the Application**
   - Homepage: http://localhost:3000
   - Kiosk: http://localhost:3000/kiosk
   - Display: http://localhost:3000/display
   - Loket: http://localhost:3000/loket
   - Admin: http://localhost:3000/admin
   - Login: http://localhost:3000/login

## 🔐 Default Credentials

After seeding:

- **Admin**: `admin` / `admin123`
- **Petugas 1**: `petugas1` / `petugas123`
- **Petugas 2**: `petugas2` / `petugas123`
- **Petugas 3**: `petugas3` / `petugas123`

## 📚 Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
npm run prisma:generate  # Generate Prisma Client
npm run prisma:push      # Push schema to database
npm run prisma:migrate   # Create migration
npm run prisma:studio    # Open Prisma Studio
```

## 🏗️ Project Structure

```
SFD-Antri/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding script
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── admin/         # Admin dashboard
│   │   ├── display/       # Queue display screen
│   │   ├── kiosk/         # Kiosk interface
│   │   ├── loket/         # Loket staff dashboard
│   │   ├── login/         # Login page
│   │   └── page.tsx       # Homepage
│   ├── components/
│   │   └── ui/            # Shadcn UI components
│   └── lib/
│       ├── auth.ts        # Authentication utilities
│       ├── prisma.ts      # Prisma client
│       ├── queue.ts       # Queue management logic
│       ├── socket.ts      # Socket.io server
│       └── utils.ts       # Utility functions
└── server.ts              # Custom Next.js server with Socket.io
```

## 🎯 Usage Guide

### For Users (Visitors)

1. Go to Kiosk page
2. Select service type (Angkutan Umum or Angkutan Barang)
3. Get your queue number
4. Wait for your number to be called on the Display screen

### For Loket Staff

1. Login at `/login`
2. Click "Call Next" to call the next queue
3. Use "Complete" when service is done
4. Use "Skip" if customer doesn't show up

### For Admin

1. Login with admin credentials
2. View statistics and reports
3. Filter by date range
4. Export reports (feature to be implemented)

## 🔧 Troubleshooting

### Database Connection Error

Make sure PostgreSQL is running:
```bash
sudo systemctl status postgresql
```

### Port Already in Use

Change port in `.env`:
```env
PORT=3001
```

### Socket.io Not Connecting

Ensure custom server is running (not standard `next dev`)

## 📝 TODO / Future Enhancements

- [ ] Professional audio announcements (pre-recorded voice assets)
- [ ] Thermal printer integration (WebUSB/WebSerial)
- [ ] PDF/Excel export for reports
- [ ] User management CRUD in Admin
- [ ] Email notifications
- [ ] Multiple language support
- [ ] Mobile app (React Native)

## 📄 License

Proprietary - Dinas Perhubungan

## 👥 Support

For issues and questions, contact the development team.

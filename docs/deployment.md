# 🚀 Panduan Deployment Production

## Daftar Isi

1. [Pilihan Deployment](#pilihan-deployment)
2. [Deployment dengan VPS (Manual)](#deployment-dengan-vps-manual)
3. [Deployment dengan Docker](#deployment-dengan-docker)
4. [Deployment dengan Vercel + Railway](#deployment-dengan-vercel--railway)
5. [Konfigurasi Domain & SSL](#konfigurasi-domain--ssl)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pilihan Deployment

### Option 1: VPS (Recommended untuk Full Control)
**Pros:**
- Full control server
- Support Socket.io tanpa limitasi
- Custom configuration
- Cocok untuk intranet/internal network

**Cons:**
- Perlu manage server sendiri
- Biaya lebih tinggi

**Recommended VPS:**
- DigitalOcean Droplet
- AWS EC2
- Vultr
- Contabo

### Option 2: Docker (Recommended untuk Scalability)
**Pros:**
- Easy deployment & scaling
- Isolated environment
- CI/CD friendly
- Portable

**Cons:**
- Perlu belajar Docker
- Resource overhead

### Option 3: Vercel + Railway (Easiest)
**Pros:**
- Deploy dengan 1 command
- Auto SSL
- Global CDN
- Free tier available

**Cons:**
- Socket.io perlu workaround
- Serverless limitations

---

## Deployment dengan VPS (Manual)

### Spesifikasi Server Minimum

- **CPU**: 2 cores
- **RAM**: 2GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 22.04 LTS

### Step 1: Setup Server

**Login ke VPS:**
```bash
ssh root@your-server-ip
```

**Update system:**
```bash
apt update && apt upgrade -y
```

**Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version  # Should show v20.x
```

**Install PostgreSQL:**
```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

**Install Nginx:**
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

**Install PM2 (Process Manager):**
```bash
npm install -g pm2
```

### Step 2: Setup Database

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE antrian_db;
CREATE USER antrian_user WITH PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE antrian_db TO antrian_user;
ALTER DATABASE antrian_db OWNER TO antrian_user;
\q
```

### Step 3: Deploy Application

**Clone/Upload aplikasi:**
```bash
cd /var/www
git clone <your-repo-url> antrian
cd antrian

# Atau upload via SCP/SFTP
```

**Install dependencies:**
```bash
npm install --production
```

**Setup environment:**
```bash
nano .env
```

```env
DATABASE_URL="postgresql://antrian_user:STRONG_PASSWORD_HERE@localhost:5432/antrian_db"
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
JWT_SECRET=generate-random-secret-here
PORT=3000
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

**Setup database:**
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

**Build aplikasi:**
```bash
npm run build
```

### Step 4: Run dengan PM2

**Create PM2 ecosystem file:**
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'antrian-app',
    script: 'server.ts',
    interpreter: 'npx',
    interpreter_args: 'tsx',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G'
  }]
}
```

**Start aplikasi:**
```bash
mkdir logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Check status:**
```bash
pm2 status
pm2 logs antrian-app
```

### Step 5: Setup Nginx Reverse Proxy

```bash
nano /etc/nginx/sites-available/antrian
```

```nginx
upstream antrian_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://antrian_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io support
    location /socket.io/ {
        proxy_pass http://antrian_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://antrian_backend;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable site:**
```bash
ln -s /etc/nginx/sites-available/antrian /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Step 6: Setup SSL dengan Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow prompts. Certbot akan:
- Generate SSL certificate
- Auto-configure Nginx
- Setup auto-renewal

**Test auto-renewal:**
```bash
certbot renew --dry-run
```

---

## Deployment dengan Docker

### Dockerfile

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    restart: always
    environment:
      POSTGRES_USER: antrian_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: antrian_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    restart: always
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://antrian_user:${DB_PASSWORD}@postgres:5432/antrian_db
      NEXT_PUBLIC_APP_URL: ${APP_URL}
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

### .env untuk Docker

```env
DB_PASSWORD=your_secure_password
APP_URL=https://yourdomain.com
JWT_SECRET=your_jwt_secret
```

### Deploy dengan Docker Compose

```bash
# Build dan run
docker-compose up -d

# Check logs
docker-compose logs -f app

# Run migrations
docker-compose exec app npx prisma db push

# Seed database
docker-compose exec app npx prisma db seed

# Stop
docker-compose down
```

---

## Deployment dengan Vercel + Railway

### Railway (Database)

1. **Buat akun di Railway.app**
2. **Create New Project → PostgreSQL**
3. **Copy DATABASE_URL** dari Railway dashboard

### Vercel (Application)

**Install Vercel CLI:**
```bash
npm install -g vercel
```

**Deploy:**
```bash
vercel
```

**Set environment variables di Vercel Dashboard:**
```
DATABASE_URL=<from-railway>
NEXT_PUBLIC_APP_URL=<your-vercel-url>
NODE_ENV=production
JWT_SECRET=<generate-random>
```

**⚠️ Socket.io Limitation:**

Vercel serverless tidak support persistent WebSocket. Solusi:
1. Deploy Socket.io server terpisah di VPS/Railway
2. Atau gunakan managed service seperti Pusher/Ably

---

## Konfigurasi Domain & SSL

### Setup DNS

Arahkan domain ke server IP:

```
Type    Name    Value           TTL
A       @       your-server-ip  3600
A       www     your-server-ip  3600
```

### SSL Certificate (Let's Encrypt)

**Auto dengan Certbot:**
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Manual renewal jika perlu:**
```bash
certbot renew
```

### Force HTTPS

Update Nginx config:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring & Maintenance

### PM2 Monitoring

```bash
# Status
pm2 status

# Logs
pm2 logs antrian-app

# Restart
pm2 restart antrian-app

# Monitor resources
pm2 monit
```

### Database Backup

**Manual backup:**
```bash
pg_dump -U antrian_user antrian_db > backup_$(date +%Y%m%d).sql
```

**Restore:**
```bash
psql -U antrian_user antrian_db < backup_20251126.sql
```

**Automated backup (cron):**
```bash
crontab -e
```

```
0 2 * * * pg_dump -U antrian_user antrian_db > /backups/antrian_$(date +\%Y\%m\%d).sql
```

### Log Rotation

```bash
# Install logrotate
apt install -y logrotate

# Create config
nano /etc/logrotate.d/antrian
```

```
/var/www/antrian/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reload antrian-app > /dev/null
    endscript
}
```

### System Updates

```bash
# Update packages
apt update && apt upgrade -y

# Update Node.js dependencies
cd /var/www/antrian
npm update
npm audit fix

# Rebuild
npm run build

# Restart
pm2 restart antrian-app
```

### Health Check

Create monitoring endpoint di `/api/health`:
```typescript
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date() });
}
```

**Setup uptime monitoring:**
- UptimeRobot: https://uptimerobot.com
- Pingdom: https://pingdom.com

---

## Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Generate strong JWT_SECRET
- [ ] Enable firewall (ufw)
- [ ] Setup fail2ban
- [ ] Regular security updates
- [ ] Database backups automated
- [ ] SSL certificate installed
- [ ] HTTP to HTTPS redirect
- [ ] Disable root SSH login
- [ ] Use SSH keys instead of password

### Firewall Setup

```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

---

## Performance Optimization

### Database Indexing

Already configured in Prisma schema:
```prisma
@@index([status, type])
@@index([createdAt])
```

### Nginx Caching

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

location /_next/static {
    proxy_cache my_cache;
    proxy_cache_valid 200 60m;
}
```

### PM2 Cluster Mode

Edit `ecosystem.config.js`:
```javascript
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster'
```

---

## Troubleshooting Production

### App tidak bisa diakses

```bash
# Check PM2
pm2 status

# Check Nginx
nginx -t
systemctl status nginx

# Check firewall
ufw status
```

### Database connection timeout

```bash
# Check PostgreSQL
systemctl status postgresql

# Check connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

### High memory usage

```bash
# Check memory
free -h

# Restart app
pm2 restart antrian-app

# Set memory limit in PM2
max_memory_restart: '1G'
```

---

## Kesimpulan

Pilih metode deployment sesuai kebutuhan:

- **VPS Manual**: Full control, cocok untuk internal/intranet
- **Docker**: Scalable, modern, CI/CD friendly  
- **Vercel + Railway**: Easiest, tapi terbatas untuk Socket.io

Setelah deployment berhasil, lakukan:
1. Testing semua fitur
2. Setup monitoring
3. Configure backups
4. Security hardening
5. Performance optimization

**Selamat! Aplikasi Anda sudah production-ready! 🎉**

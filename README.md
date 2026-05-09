# SNX-MOP

A lightweight OTP middleware service for integrating SMS verification into external platforms such as SurveyCake.

The application provides OTP generation, SMS delivery through AccessYou, Redis-based temporary OTP storage, and PostgreSQL persistence for verified phone numbers.

This project acts as a secure middleware layer between:

- Frontend / form providers (ex: SurveyCake)
- OTP storage and validation logic
- SMS delivery provider APIs (AccessYou)

The service is built with:

- Node.js + Express
- Redis for temporary OTP storage
- PostgreSQL for verified phone number persistence
- Docker / Docker Compose deployment
- Nginx reverse proxy support

# Architecture

## Send OTP Flow

```text
SurveyCake / Frontend
        ↓
 HTTPS API Request
        ↓
Nginx Reverse Proxy
        ↓
Node.js Express App
        ↓
Redis (Temporary OTP Storage)
        ↓
AccessYou SMS API
```

## Verify OTP Flow

```text
SurveyCake / Frontend
        ↓
 HTTPS API Request
        ↓
Nginx Reverse Proxy
        ↓
Node.js Express App
        ↓
Redis (OTP Validation)
        ↓
PostgreSQL (Verified Phone Storage)
```

# Requirements

- Ubuntu 22.04+
- Docker
- Docker Compose
- Nginx
- Domain name with HTTPS
- Node.js 20+
- Redis
- PostgreSQL

optional:
- PM2

---

# Quick Start (Docker)

## 1. Clone Repository

```bash
git clone https://github.com/CheungLeo/SNX-MOP.git
cd SNX-MOP
```

---

## 2. Create Environment File

Create a `.env` file:

```env
PORT=3000

REDIS_HOST=redis
REDIS_PORT=6379

DATABASE_URL=postgresql://postgres:your_password@postgres:5432/snx_mop

ACCESSYOU_ACCOUNTNO=your_account_number
ACCESSYOU_USER=your_user
ACCESSYOU_PWD=your_password
ACCESSYOU_TID=your_tid

ACCESSYOU_ACCOUNT=your_account
ACCESSYOU_USER=your_user
ACCESSYOU_PWD=your_password
ACCESSYOU_TID=your_tid

```

---

## 3. Start Containers

```bash
docker compose up -d
```

Check running containers:

```bash
docker ps
```

---

# Quick Start (Manual VPS Setup)

## Install Dependencies

### Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Redis

```bash
sudo apt install redis -y
sudo systemctl enable redis
sudo systemctl start redis
```

### PM2

```bash
npm install
```

### PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable postgresql
sudo systemctl start postgresql -g pm2
```

---

## Install Project Dependencies

```bash
npm install
```

---

## Start Application

```bash
pm2 start index.js --name snx-mop
pm2 save
pm2 startup
```

Check status:

```bash
pm2 status
```

---

# Nginx Reverse Proxy

Example configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable configuration:

```bash
sudo ln -s /etc/nginx/sites-available/snx-mop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

# HTTPS Setup

Install Certbot:

```bash
sudo apt install certbot python3-certbot-nginx -y
```

Generate SSL certificate:

```bash
sudo certbot --nginx -d yourdomain.com
```

---

# API Endpoints

Base route:

```text
/api/surveycake
```

The application expects SurveyCake-compatible payloads using the `value` field for both phone numbers and OTP values.

---

## Send OTP

```http
POST /api/surveycake/send-otp
```

### Example Request

```bash
curl -X POST https://yourdomain.com/api/surveycake/send-otp \
-H "Content-Type: application/json" \
-d '{
  "value": "91234567"

}'
```

---

## Verify OTP

```http
POST /api/surveycake/verify-otp
```

### Example Request

```bash
curl -X POST https://yourdomain.com/api/surveycake/verify-otp \
-H "Content-Type: application/json" \
-d '{
  "value": "123456"
}'
}'
```

---

# Phone Number Handling

Accepted phone number formats:

- `91234567`
- `9123 4567`
- `85291234567`
- `+85291234567`

All phone numbers are normalized internally into:

```text
852XXXXXXXX
```

---

# OTP Flow

1. User submits phone number
2. Phone number is normalized and validated
3. A 6-digit OTP is generated
4. OTP is SHA256 hashed before storage
5. OTP is stored in Redis with a 5-minute expiration
6. SMS is sent through AccessYou API
7. User submits OTP
8. OTP is verified against Redis
9. Verified phone hash is stored in PostgreSQL
10. Redis OTP entries are deleted

---

# Database Usage

## Redis

Redis is used for:

- Temporary OTP storage with 5-minute expiration
- OTP expiration handling
- Fast verification lookups

## PostgreSQL

PostgreSQL is used for:

- Persistent verified phone number storage
- Verification history
- Long-term record management

The project uses the `pg` Node.js driver with a PostgreSQL connection URL loaded through the `.env` file.

---

# Suggested Production Setup

Recommended production stack:

- Ubuntu VPS
- Docker Compose
- Nginx reverse proxy
- Cloudflare DNS + SSL
- Redis persistence enabled
- PM2 or Docker restart policies
- Firewall rules for ports 80/443 only

---

# Security Notes

- Never expose Redis publicly
- Restrict direct access to port 3000
- Use HTTPS in production
- Store secrets in `.env`
- Use fail2ban or rate limiting if publicly exposed

---

# Troubleshooting

## Redis Connection Errors

Check Redis status:

```bash
sudo systemctl status redis
```

---

## Application Not Starting

Check logs:

```bash
pm2 logs
```

or:

```bash
docker compose logs -f
```

---

## 403 / Cloudflare Issues

If requests work locally but fail on VPS:

- Verify Cloudflare firewall settings
- Check if the API provider blocks datacenter IP ranges
- Test with curl verbose mode:

```bash
curl -v https://example.com
```

---

# Project Structure

```text
SNX-MOP/
├── app.js
├── routes/
│   └── otp.js
├── services/
│   ├── accessyou.js
│   ├── postgres.js
│   └── redis.js
├── utils/
│   ├── otp.js
│   └── phone.js
├── config/
│   └── messages.js
├── nginx/
│   └── default.conf
├── init.sql
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

# Tech Stack

- Express
- Axios
- xml2js
- Axios
- ioredis
- pg (node-postgres)
- PostgreSQL connection URL environment configuration
- dotenv
- Docker
- Nginx

---

# Notes

- REMOVE DEBUG LINES BEFORE DEPLOYING IN PRODUCTION
- This guide is partly LLM-generated, so beware of inaccuracies
- Repo still WIP

Source files reviewed for this README include the Express app setup, OTP routes, Redis/PostgreSQL services, phone normalization utilities, AccessYou integration, and Nginx configuration. fileciteturn0file0 fileciteturn0file3

---

# Disclaimer

This project integrates with third-party SMS providers. API behavior, authentication methods, and rate limits may change depending on the provider.

Always test in a staging environment before deploying to production.



# OTP Middleware (SurveyCake + AccessYou)

## System Overview

This service provides: - OTP SMS sending via AccessYou API - OTP
verification for SurveyCake form validation

### Architecture

    SurveyCake
       ↓
    https://yourdomain.com/api/surveycake/*
       ↓
    Nginx (reverse proxy)
       ↓
    Node.js app (127.0.0.1:3000)
       ↓
    Redis (OTP storage)
       ↓
    AccessYou SMS API

------------------------------------------------------------------------

# 1. Server Requirements

Ubuntu 20.04+ or 22.04

Must install: - Node.js 20+ - Redis - Nginx - PM2 (process manager) -
Certbot (for HTTPS)

------------------------------------------------------------------------

# 2. Install Dependencies

## Node.js

``` bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## Redis

``` bash
sudo apt install redis -y
sudo systemctl enable redis
sudo systemctl start redis
```

## Nginx

``` bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

## PM2

``` bash
npm install -g pm2
```

------------------------------------------------------------------------

# 3. Deploy Application Code

Git clone

------------------------------------------------------------------------

# 4. Install Node dependencies

``` bash
cd /var/www/otp-middleware
npm install
```

------------------------------------------------------------------------

# 5. Environment Variables

Create `.env`:

``` bash
PORT=3000
REDIS_HOST=127.0.0.1

ACCESSYOU_ACCOUNT=xxxxx
ACCESSYOU_USER=xxxxx
ACCESSYOU_PWD=xxxxx
ACCESSYOU_TID=xxxxx

API_KEY=your-secure-api-key
```

------------------------------------------------------------------------

# 6. Start Application

``` bash
pm2 start app.js --name otp-api
pm2 save
pm2 startup
```

Check status:

``` bash
pm2 status
```

------------------------------------------------------------------------

# 7. Nginx Configuration

``` bash
sudo nano /etc/nginx/sites-available/otp
```

### Paste:

``` nginx
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

Enable:

``` bash
sudo ln -s /etc/nginx/sites-available/otp /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

------------------------------------------------------------------------

# 8. Firewall Setup

``` bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
sudo ufw deny 3000
```

------------------------------------------------------------------------

# 9. HTTPS Setup

``` bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

------------------------------------------------------------------------

# 10. Public API Endpoints

### Send OTP

    POST https://yourdomain.com/api/surveycake/send-otp

### Verify OTP

    POST https://yourdomain.com/api/surveycake/verify-otp

------------------------------------------------------------------------

# 11. Required Headers

    x-api-key: your-secure-api-key
    Content-Type: application/json

------------------------------------------------------------------------

# 12. Example Requests

## Send OTP

``` bash
curl -X POST https://yourdomain.com/api/surveycake/send-otp   -H "Content-Type: application/json"   -H "x-api-key: your-secure-api-key"   -d '{"phone":"+85291234567"}'
```

## Verify OTP

``` bash
curl -X POST https://yourdomain.com/api/surveycake/verify-otp   -H "Content-Type: application/json"   -H "x-api-key: your-secure-api-key"   -d '{"phone":"+85291234567","otp":"123456"}'
```

# Checklist

-   Domain working
-   HTTPS enabled
-   Node running via PM2
-   Redis active
-   Nginx configured
-   Firewall secured

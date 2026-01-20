# Deployment Guide (Git + PM2 + Nginx)

This guide covers how to deploy the Metricool API Middleware manually on a Linux server (Ubuntu/Debian) using Git, PM2, and Nginx.

**Prerequisites:**
-   **Node.js** (v18 or v20 LTS)
-   **PostgreSQL** (Managed or Local)
-   **Ollama** (Required for AI features)
-   **Nginx** (Web Server)

---

## 1. Server Setup (One-time)

### Install Node.js & PM2
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2
```

### Install Ollama (AI Engine)
Since this app relies on local AI models, you must install Ollama on the host.
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull required models
ollama pull llama3.2
ollama pull llama3.2-vision
```
*Note: Ensure your server has enough RAM (at least 8GB recommended for Llama models).*

---

## 2. Application Deployment

### Clone & Install
```bash
# Clone repository
git clone <your-repo-url> metricool-api
cd metricool-api

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate
```

### Environment Configuration
Create a `.env` file based on the example:
```bash
cp .env.example .env
nano .env
```
**Crucial Settings:**
-   `DATABASE_URL`: Your PostgreSQL connection string.
-   `OLLAMA_HOST`: `http://127.0.0.1:11434` (Default for local install).

### Start with PM2
We use `ecosystem.config.js` for process management.
```bash
# Start application in production mode
pm2 start ecosystem.config.js --env production

# Save PM2 list to respawn on reboot
pm2 save
pm2 startup
```

---

## 3. Nginx Reverse Proxy (Optional but Recommended)

Nginx handles SSL and port forwarding (removing the need to expose port 3000 directly).

1.  **Install Nginx**: `sudo apt install nginx`
2.  **Create Config**: `sudo nano /etc/nginx/sites-available/metricool-api`

```nginx
server {
    listen 80;
    server_name your-domain.com; # Change this

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3.  **Enable Site**:
```bash
sudo ln -s /etc/nginx/sites-available/metricool-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 4. Maintenance & Updates

To update the application later:

```bash
# 1. Pull latest code
git pull origin main

# 2. Install new deps (if any)
npm install
npx prisma generate
npx prisma migrate deploy # If DB schema changed

# 3. Restart PM2
pm2 restart metricool-api
```

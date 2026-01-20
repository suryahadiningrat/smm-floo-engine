# Deployment Guide (Docker + Nginx)

This guide covers how to deploy the Metricool API Middleware using **Docker Compose** and expose it via **Nginx** (Reverse Proxy) on a Linux server.

**Prerequisites:**
-   **Docker Engine** & **Docker Compose**
-   **Nginx** (Installed on the host machine)
-   **Git**

---

## 1. Application Deployment (Docker)

### Clone & Setup
```bash
# Clone repository
git clone <your-repo-url> metricool-api
cd metricool-api

# Create environment file
cp .env.example .env
nano .env
```
**Crucial .env Settings:**
-   `DATABASE_URL`: Your PostgreSQL connection string.
    -   *If DB is on the host*: Use the host's IP (e.g., `172.17.0.1` or actual IP), NOT `localhost`.
    -   *If DB is remote*: Use the remote connection string.

### Start Containers
This will start both the Node.js API and the internal Ollama service.

```bash
# Build and start in detached mode
docker compose up -d
```

### Setup AI Models (First Time Only)
The Ollama container starts empty. You need to pull the models into the running container.

```bash
# Make script executable
chmod +x setup-models.sh

# Run setup script
./setup-models.sh
```
*This downloads Llama 3.2 and Llama 3.2 Vision.*

---

## 2. Nginx Reverse Proxy Configuration

Configure Nginx on the **host machine** to forward traffic to the Docker container (running on port 3000).

1.  **Create Config**: `sudo nano /etc/nginx/sites-available/metricool-api`

```nginx
server {
    listen 80;
    server_name your-domain.com; # REPLACE with your actual domain or IP

    location / {
        # Proxy to the Docker container mapped to port 3000
        proxy_pass http://127.0.0.1:3000;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Forward real client IP
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

2.  **Enable Site**:
```bash
sudo ln -s /etc/nginx/sites-available/metricool-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 3. Maintenance

### Updating the Application
```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild and restart containers
docker compose up -d --build

# 3. Clean up old images (Optional)
docker image prune -f
```

### Logs
```bash
# View API logs
docker compose logs -f app

# View Ollama logs
docker compose logs -f ollama
```

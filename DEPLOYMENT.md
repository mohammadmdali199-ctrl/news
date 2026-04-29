# Linux Server Deployment Guide for News Portal

## Prerequisites
- Ubuntu/Debian Linux server
- Root or sudo access
- Domain name (optional but recommended)

## Step 1: Update System
```bash
sudo apt update && sudo apt upgrade -y
```

## Step 2: Install Node.js
```bash
# Install Node.js 18+ (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 3: Install MySQL
```bash
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation
sudo mysql_secure_installation
```

## Step 4: Create Database
```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE newsvs;
CREATE USER 'newsuser'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON newsvs.* TO 'newsuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 5: Upload Project Files
```bash
# Create project directory
sudo mkdir -p /var/www/news-portal
cd /var/www/news-portal

# Upload your project files here (use SCP, SFTP, or Git)
# Example with Git:
git clone https://github.com/your-repo/news-portal.git .
# Or upload via SCP:
# scp -r /local/path/* user@server:/var/www/news-portal/
```

## Step 6: Install Dependencies
```bash
cd /var/www/news-portal
npm install --production
```

## Step 7: Import Database Schema
```bash
mysql -u newsuser -p newsvs < sql/schema.sql
```

## Step 8: Configure Environment
```bash
# Edit .env file
nano .env
```

Update the following in .env:
```
DB_HOST=localhost
DB_USER=newsuser
DB_PASSWORD=your_secure_password
DB_NAME=newsvs
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
JWT_SECRET=your-jwt-secret-key-change-this-in-production
PORT=3000
NODE_ENV=production
```

## Step 9: Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

## Step 10: Start Application with PM2
```bash
pm2 start app.js --name "news-portal"
pm2 startup
pm2 save
```

## Step 11: Install Nginx (Reverse Proxy)
```bash
sudo apt install nginx -y
```

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/news-portal
```

Add this content:
```
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/news-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 12: Install SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Step 13: Configure Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## Step 14: Set Proper Permissions
```bash
sudo chown -R www-data:www-data /var/www/news-portal
sudo chmod -R 755 /var/www/news-portal
sudo chmod -R 777 /var/www/news-portal/public/uploads
```

## Step 15: Monitor and Logs
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs news-portal

# Restart application
pm2 restart news-portal

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Step 16: Backup Setup (Optional)
```bash
# Database backup script
sudo nano /usr/local/bin/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u newsuser -p'your_password' newsvs > /var/backups/news-portal-db-$DATE.sql
find /var/backups/ -name "news-portal-db-*.sql" -mtime +7 -delete
```

```bash
sudo chmod +x /usr/local/bin/backup-db.sh
# Add to crontab for daily backup
# crontab -e
# 0 2 * * * /usr/local/bin/backup-db.sh
```

## Access Your Application
- **Website:** http://your-domain.com
- **Admin Panel:** http://your-domain.com/admin
- **Default Admin:** admin@newsportal.com / admin123

## Troubleshooting

### If application doesn't start:
```bash
pm2 logs news-portal
```

### Check database connection:
```bash
mysql -u newsuser -p newsvs -e "SELECT 1"
```

### Restart services:
```bash
sudo systemctl restart nginx
pm2 restart news-portal
```

### Update application:
```bash
cd /var/www/news-portal
git pull origin main
npm install
pm2 restart news-portal
```

## Security Checklist
- [ ] Change default admin password
- [ ] Use strong database password
- [ ] Enable SSL/HTTPS
- [ ] Configure firewall
- [ ] Regular backups
- [ ] Monitor logs
- [ ] Keep system updated
- [ ] Use fail2ban for SSH protection

Your news portal is now live on Linux server! 🎉
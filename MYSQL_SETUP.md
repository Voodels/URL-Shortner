# 🗄️ MySQL Database Setup Guide

This guide will help you set up MySQL database for the URL Shortener application.

---

## 📋 Table of Contents

1. [Quick Start with Docker](#quick-start-with-docker)
2. [Manual MySQL Installation](#manual-mysql-installation)
3. [Configuration](#configuration)
4. [Database Schema](#database-schema)
5. [Switching from In-Memory to MySQL](#switching-storage)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start with Docker (Recommended)

The easiest way to run MySQL locally is using Docker Compose.

### Prerequisites
- Docker and Docker Compose installed
- Ports 3306 (MySQL) and 8080 (Adminer) available

### Steps

1. **Start MySQL and Adminer**:
   ```bash
   docker-compose up -d
   ```

2. **Verify MySQL is running**:
   ```bash
   docker-compose ps
   ```

3. **Check logs**:
   ```bash
   docker-compose logs -f mysql
   ```

4. **Database is auto-created** with schema from `database/schema.sql`

5. **Access Adminer** (Web UI) at http://localhost:8080:
   - **System**: MySQL
   - **Server**: mysql
   - **Username**: urluser
   - **Password**: urlpassword
   - **Database**: url_shortener

6. **Configure your app** (create `.env` file):
   ```bash
   cp .env.example .env
   ```

   Update `.env`:
   ```env
   DB_TYPE=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=urluser
   DB_PASSWORD=urlpassword
   DB_NAME=url_shortener
   ```

7. **Start your application**:
   ```bash
   ./start.sh
   ```

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove all data
docker-compose down -v

# View logs
docker-compose logs -f mysql

# Connect to MySQL CLI
docker-compose exec mysql mysql -u urluser -purlpassword url_shortener

# Restart MySQL
docker-compose restart mysql
```

---

## 🔧 Manual MySQL Installation

If you prefer to install MySQL directly on your system:

### Ubuntu/Debian

```bash
# Update package index
sudo apt update

# Install MySQL Server
sudo apt install mysql-server

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure installation
sudo mysql_secure_installation
```

### macOS (Homebrew)

```bash
# Install MySQL
brew install mysql

# Start MySQL service
brew services start mysql

# Secure installation
mysql_secure_installation
```

### Windows

1. Download MySQL Installer from https://dev.mysql.com/downloads/installer/
2. Run installer and choose "Developer Default"
3. Follow installation wizard
4. Set root password during installation

### Create Database and User

```bash
# Connect to MySQL as root
mysql -u root -p

# Run these SQL commands:
```

```sql
-- Create database
CREATE DATABASE url_shortener
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'urluser'@'localhost' IDENTIFIED BY 'urlpassword';

-- Grant privileges
GRANT ALL PRIVILEGES ON url_shortener.* TO 'urluser'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

### Import Schema

```bash
# Import schema.sql
mysql -u urluser -purlpassword url_shortener < database/schema.sql

# Verify tables
mysql -u urluser -purlpassword url_shortener -e "SHOW TABLES;"
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Server Configuration
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_REQUESTS=true

# Database Configuration
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=urluser
DB_PASSWORD=urlpassword
DB_NAME=url_shortener
DB_POOL_SIZE=10
```

### Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_TYPE` | `memory` | Storage type: `memory` or `mysql` |
| `DB_HOST` | `localhost` | MySQL server hostname |
| `DB_PORT` | `3306` | MySQL server port |
| `DB_USER` | `root` | MySQL username |
| `DB_PASSWORD` | `` | MySQL password |
| `DB_NAME` | `url_shortener` | Database name |
| `DB_POOL_SIZE` | `10` | Connection pool size |

---

## 📊 Database Schema

The database has a single `urls` table:

```sql
CREATE TABLE urls (
  id CHAR(36) PRIMARY KEY,              -- UUID
  url VARCHAR(2048) NOT NULL,           -- Original URL
  short_code VARCHAR(10) NOT NULL UNIQUE, -- Short code
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  access_count INT UNSIGNED NOT NULL DEFAULT 0,

  INDEX idx_short_code (short_code),
  INDEX idx_created_at (created_at),
  INDEX idx_access_count (access_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Indexes

- **Primary Key** on `id` - Fast lookups by ID
- **Unique Index** on `short_code` - Prevent duplicates, fast lookups
- **Index** on `created_at` - Fast sorting by date
- **Index** on `access_count` - Fast analytics queries

---

## 🔄 Switching Storage

### From In-Memory to MySQL

1. **Ensure MySQL is running**:
   ```bash
   docker-compose ps
   # OR
   sudo systemctl status mysql
   ```

2. **Update `.env`**:
   ```env
   DB_TYPE=mysql
   ```

3. **Restart application**:
   ```bash
   # Stop current servers
   pkill deno

   # Start with MySQL
   ./start.sh
   ```

4. **Verify connection**:
   Check terminal output for:
   ```
   📦 Initializing MYSQL repository...
   ✅ Connected to MySQL database
   ✅ MySQL repository initialized
   ```

### From MySQL back to In-Memory

1. **Update `.env`**:
   ```env
   DB_TYPE=memory
   ```

2. **Restart application**:
   ```bash
   ./start.sh
   ```

---

## 🐛 Troubleshooting

### Cannot connect to MySQL

**Error**: `Failed to connect to MySQL: Connection refused`

**Solutions**:
```bash
# Check if MySQL is running
docker-compose ps
# OR
sudo systemctl status mysql

# Check if port 3306 is open
netstat -tlnp | grep 3306

# Restart MySQL
docker-compose restart mysql
# OR
sudo systemctl restart mysql
```

### Authentication failed

**Error**: `Access denied for user 'urluser'@'localhost'`

**Solutions**:
1. **Verify credentials** in `.env` match your MySQL user
2. **Recreate user**:
   ```sql
   DROP USER IF EXISTS 'urluser'@'localhost';
   CREATE USER 'urluser'@'localhost' IDENTIFIED BY 'urlpassword';
   GRANT ALL PRIVILEGES ON url_shortener.* TO 'urluser'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Table doesn't exist

**Error**: `Table 'url_shortener.urls' doesn't exist`

**Solution**:
```bash
# Re-import schema
mysql -u urluser -purlpassword url_shortener < database/schema.sql

# Verify
mysql -u urluser -purlpassword url_shortener -e "SHOW TABLES;"
```

### Connection pool exhausted

**Error**: `Too many connections`

**Solutions**:
1. **Increase pool size** in `.env`:
   ```env
   DB_POOL_SIZE=20
   ```

2. **Check MySQL max connections**:
   ```sql
   SHOW VARIABLES LIKE 'max_connections';
   ```

3. **Increase MySQL connections**:
   ```sql
   SET GLOBAL max_connections = 200;
   ```

### Docker Compose issues

**Error**: `port 3306 already in use`

**Solution**:
```bash
# Find process using port 3306
lsof -i :3306

# Stop it
sudo systemctl stop mysql

# Or change port in docker-compose.yml
ports:
  - "3307:3306"  # Use 3307 on host
```

---

## 📈 Performance Tuning

### Optimize MySQL for Development

Add to your `~/.my.cnf` or MySQL config:

```ini
[mysqld]
# InnoDB settings
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
innodb_flush_log_at_trx_commit = 2

# Query cache (if available)
query_cache_type = 1
query_cache_size = 32M

# Connection settings
max_connections = 150
```

### Monitor Performance

```sql
-- Show current connections
SHOW PROCESSLIST;

-- Show table status
SHOW TABLE STATUS WHERE Name = 'urls';

-- Analyze queries
EXPLAIN SELECT * FROM urls WHERE short_code = 'abc123';

-- Show slow queries
SHOW VARIABLES LIKE 'slow_query_log';
```

---

## 🔐 Security Best Practices

1. **Use strong passwords** in production
2. **Never commit `.env`** to version control
3. **Use environment-specific credentials**
4. **Enable SSL/TLS** for remote connections
5. **Regular backups**:
   ```bash
   # Backup database
   mysqldump -u urluser -purlpassword url_shortener > backup.sql

   # Restore database
   mysql -u urluser -purlpassword url_shortener < backup.sql
   ```

---

## 🎯 Next Steps

Once MySQL is set up:

1. ✅ Start the application with `./start.sh`
2. ✅ Create a short URL via frontend or API
3. ✅ Check Adminer to see data in MySQL
4. ✅ Test that URLs persist after restart

**Your data is now persisted in MySQL!** 🎉

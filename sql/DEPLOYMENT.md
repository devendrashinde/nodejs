# Database Deployment Guide

## 📋 SQL Files Overview

The `sql/` folder contains updated schema files optimized for Photo Gallery v2.0:

### Main Files

1. **[mydb-mysql.sql](mydb-mysql.sql)** - Complete database setup (RECOMMENDED)
   - Creates entire database from scratch
   - Includes all tables, indexes, and views
   - MySQL 8.0+ compatible
   - Use this for fresh installations

2. **[photos.sql](photos.sql)** - Photos table only
   - For updating existing photos table
   - Adds indexes and timestamp fields

3. **[tags.sql](tags.sql)** - Tags table only
   - For tag management
   - Unique constraint on tags

4. **[users.sql](users.sql)** - Users table only
   - For authentication system
   - Includes role-based access

5. **[mydb-mariadb.sql](mydb-mariadb.sql)** - MariaDB optimized schema
   - Use for MariaDB 10.5+ deployments
   - MariaDB-compatible syntax (current_timestamp())
   - Same features as MySQL version

6. **[migration_v1_to_v2.sql](migration_v1_to_v2.sql)** - MySQL migration script
   - Upgrades existing v1.0 database to v2.0
   - Preserves all data

7. **[migration_v1_to_v2_mariadb.sql](migration_v1_to_v2_mariadb.sql)** - MariaDB migration script
   - Upgrades existing v1.0 MariaDB database to v2.0
   - MariaDB-compatible migration

---

## 🆕 What Changed in v2.0?

### Schema Improvements

✅ **Engine Change**: MyISAM → InnoDB
   - ACID compliance
   - Transaction support
   - Better concurrent access
   - Foreign key support

✅ **Character Set**: Consistent utf8mb4
   - Full Unicode support
   - Emoji support
   - Better international character handling

✅ **Field Types**: TEXT → VARCHAR where appropriate
   - Better indexing performance
   - Optimized for common queries

✅ **New Indexes**:
   - `idx_album` - Faster album queries
   - `idx_name` - Faster name lookups
   - `idx_tags_fulltext` - Full-text search on tags

✅ **Timestamp Fields**:
   - `created_at` - Record creation time
   - `updated_at` - Automatic update tracking

✅ **New Tables**:
   - `tasks` - Background task management
   - `schema_version` - Track database migrations

✅ **New Views**:
   - `v_photos_by_album` - Photo count statistics
   - `v_popular_tags` - Tag usage analytics

---

## 🚀 Deployment Options

### Option 1: Fresh Installation (Recommended)

Use this for new deployments or development environments:

**MySQL 8.0+:**

```bash
# Using Docker (easiest)
docker-compose -f docker-compose-mysql.yaml up -d
mysql -h 127.0.0.1 -u root -pphotos < sql/mydb-mysql.sql

# Or using local MySQL
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS mydb CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
mysql -u root -p mydb < sql/mydb-mysql.sql
```

**MariaDB 10.5+:**

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS mydb CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"

# Import MariaDB-optimized schema
mysql -u root -p mydb < sql/mydb-mariadb.sql

# Verify
mysql -u root -p mydb -e "SHOW TABLES; SELECT * FROM schema_version;"
```

# Or without Docker
mysql -u root -p < sql/mydb-mysql.sql
```

This will:
- ✅ Drop existing `mydb` database
- ✅ Create fresh database with all tables
- ✅ Add indexes and views
- ✅ Insert sample data

### Option 2: Upgrade Existing Database

⚠️ **WARNING**: This will modify your existing data. **Backup first!**

**MySQL 8.0+:**

```bash
# 1. Backup existing database
mysqldump -u root -p mydb > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run MySQL migration script
mysql -u root -p mydb < sql/migration_v1_to_v2.sql
```

**MariaDB 10.5+:**

```bash
# 1. Backup existing database
mysqldump -u root -p mydb > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run MariaDB migration script
mysql -u root -p mydb < sql/migration_v1_to_v2_mariadb.sql
```

### Option 3: Manual Table Updates

Update individual tables without losing data:

```bash
# Update photos table structure
mysql -u root -p mydb < sql/photos.sql

# Update tags table structure
mysql -u root -p mydb < sql/tags.sql

# Update users table structure
mysql -u root -p mydb < sql/users.sql
```

---

## 🔄 Migration from v1.0 to v2.0

### Pre-Migration Checklist

- [ ] Backup current database
- [ ] Test on non-production environment first
- [ ] Verify application is compatible with new schema
- [ ] Plan for downtime (estimated 5-10 minutes)

### Migration Steps

1. **Backup Database**
   ```bash
   mysqldump -u root -p mydb > mydb_backup_v1.sql
   ```

2. **Run Migration Script**
   ```sql
   -- See sql/migration_v1_to_v2.sql
   ```

3. **Verify Migration**
   ```bash
   # Check tables exist
   mysql -u root -p -e "SHOW TABLES FROM mydb;"
   
   # Check indexes
   mysql -u root -p -e "SHOW INDEXES FROM mydb.photos;"
   
   # Verify data
   mysql -u root -p -e "SELECT COUNT(*) FROM mydb.photos;"
   ```

4. **Test Application**
   - Start application: `npm start`
   - Check database connection: Should show `✓ Database connected successfully`
   - Test photo upload and retrieval

---

## 📊 Schema Comparison

### Photos Table

| Field | v1.0 | v2.0 | Notes |
|-------|------|------|-------|
| id | int AUTO_INCREMENT | int AUTO_INCREMENT | No change |
| name | TEXT | VARCHAR(500) | Better indexing |
| tags | TEXT | TEXT | No change |
| album | TEXT | VARCHAR(500) | Better indexing |
| path | TEXT | VARCHAR(1000) | Better indexing |
| created_at | ❌ | TIMESTAMP | ✅ NEW |
| updated_at | ❌ | TIMESTAMP | ✅ NEW |
| Engine | MyISAM | InnoDB | ✅ IMPROVED |
| Indexes | PRIMARY only | PRIMARY + 3 indexes | ✅ IMPROVED |

### Tags Table

| Field | v1.0 | v2.0 | Notes |
|-------|------|------|-------|
| id | int AUTO_INCREMENT | int AUTO_INCREMENT | No change |
| tag | TEXT | VARCHAR(255) | Better indexing |
| created_at | ❌ | TIMESTAMP | ✅ NEW |
| Engine | MyISAM | InnoDB | ✅ IMPROVED |
| Constraints | None | UNIQUE on tag | ✅ IMPROVED |

### Users Table

| Field | v1.0 | v2.0 | Notes |
|-------|------|------|-------|
| id | VARCHAR(255) | VARCHAR(255) | No change |
| username | VARCHAR(250) | VARCHAR(100) | Optimized |
| password | VARCHAR(250) | VARCHAR(255) | Bcrypt compatible |
| email | ❌ | VARCHAR(255) | ✅ NEW |
| role | ❌ | ENUM | ✅ NEW |
| active | ❌ | TINYINT(1) | ✅ NEW |
| registered | DATETIME | TIMESTAMP | Improved |
| last_login | DATETIME | TIMESTAMP | Improved |
| created_at | ❌ | TIMESTAMP | ✅ NEW |
| updated_at | ❌ | TIMESTAMP | ✅ NEW |
| Engine | MyISAM | InnoDB | ✅ IMPROVED |

---

## 🔍 Verification Queries

After deployment, run these to verify:

```sql
-- Check database version
SELECT * FROM schema_version;

-- Check table engines
SELECT TABLE_NAME, ENGINE 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'mydb';

-- Check indexes on photos table
SHOW INDEXES FROM photos;

-- Check character sets
SELECT TABLE_NAME, TABLE_COLLATION 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'mydb';

-- Test full-text search
SELECT * FROM photos 
WHERE MATCH(tags) AGAINST('sample' IN NATURAL LANGUAGE MODE);

-- Check views
SELECT * FROM v_photos_by_album;
SELECT * FROM v_popular_tags LIMIT 10;
```

---

## 🐛 Troubleshooting

### Error: "Table 'mydb.photos' doesn't exist"

**Solution:**
```bash
mysql -u root -p mydb < sql/mydb-mysql.sql
```

### Error: "Specified key was too long"

**Cause:** TEXT fields can't be fully indexed

**Solution:** Already fixed in v2.0 by using VARCHAR with length limits

### Error: "Can't DROP 'idx_tags_fulltext'; check that column/key exists"

**Cause:** Running migration on already-migrated database

**Solution:** Skip already-applied changes or use fresh installation

### Error: "Unknown character set: 'utf8mb4'"

**Cause:** MySQL version too old (< 5.5.3)

**Solution:** Upgrade MySQL to 8.0+ or use utf8 instead

---

## 📝 Rollback Procedure

If something goes wrong:

```bash
# 1. Stop application
npm stop  # or Ctrl+C

# 2. Drop new database
mysql -u root -p -e "DROP DATABASE mydb;"

# 3. Restore from backup
mysql -u root -p < mydb_backup_v1.sql

# 4. Restart application with v1.0 code
```

---

## 🎯 Production Deployment Checklist

- [ ] Backup production database
- [ ] Test migration on staging/dev environment
- [ ] Schedule maintenance window
- [ ] Notify users of downtime
- [ ] Run migration during low-traffic period
- [ ] Verify database connection after migration
- [ ] Test critical functionality (upload, view, search)
- [ ] Monitor application logs for errors
- [ ] Monitor database performance
- [ ] Keep backup for 24-48 hours

---

## 📚 Additional Resources

- [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)
- [InnoDB vs MyISAM](https://dev.mysql.com/doc/refman/8.0/en/innodb-introduction.html)
- [Full-Text Search](https://dev.mysql.com/doc/refman/8.0/en/fulltext-search.html)
- [Character Sets and Collations](https://dev.mysql.com/doc/refman/8.0/en/charset.html)

---

**Created:** 2026-02-02  
**Schema Version:** 2.0.0  
**MySQL Version:** 8.0.30+  
**Status:** Production Ready ✅

# Photo Gallery Development Guide

**For developers working on the Photo Gallery project.**

---

## Quick Start

### Prerequisites
- Node.js 16+ 
- MySQL 5.7 or MariaDB 10.3+
- npm or yarn

### Setup

```bash
# 1. Clone and install
git clone <repo> photos
cd photos
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=mydb

# 3. Create database
mysql -u root -p -e "CREATE DATABASE mydb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. Run migrations
mysql -u root -p mydb < sql/migration_v3_to_v4_mysql.sql

# 5. Start server
npm start
# Open http://localhost:8082
```

---

## Project Architecture

### Directory Structure

```
photos/
├── server-photos.js              # Main Express server
├── app/
│   ├── config/
│   │   ├── logger.js            # Winston logger config
│   │   └── index.js             # App config
│   ├── controllers/
│   │   ├── photoController.js   # Photo CRUD
│   │   └── playlistController.js
│   ├── middleware/
│   │   ├── errorHandler.js      # Error middleware (PLANNED)
│   │   └── validators.js         # Input validation (PLANNED)
│   ├── models/
│   │   ├── db.js                # MySQL connection pool
│   │   ├── photoModel.js
│   │   ├── albumModel.js
│   │   └── ...
│   ├── routes/
│   │   ├── photos.js
│   │   ├── albums.js
│   │   └── ...
│   ├── services/
│   │   ├── mediaService.js      # Image/video processing
│   │   ├── videoService.js
│   │   ├── exifService.js
│   │   └── ...
│   └── utils/
│       └── loggerAdapter.js     # (PLANNED - logging helper)
├── public/
│   ├── js/
│   │   ├── controllers/         # AngularJS controllers (DEPRECATING)
│   │   ├── services/
│   │   ├── directives/
│   │   ├── ng-app.js
│   │   └── main.js              # jQuery + Fancybox init
│   ├── css/
│   ├── img/
│   └── fonts/
├── views/                        # Pug templates
│   └── *.pug
├── data/                         # Source media files
│   ├── Home/
│   ├── pictures/
│   └── ...
├── cache/                        # Generated cache (JSON)
│   ├── album-cache.json
│   └── pdf-thumbnail-map.json   # (PLANNED: move to DB)
├── temp-pic/                     # Generated thumbnails
├── sql/                          # Database migrations
│   ├── migration_v1_to_v2.sql
│   ├── migration_v2_to_v2.1_image_editing.sql
│   └── ... (v3_to_v4, etc.)
├── docs/                         # Documentation
│   ├── DEVELOPMENT.md            # This file
│   ├── API.md                    # API reference (PLANNED)
│   ├── DATABASE.md               # Schema & migrations (PLANNED)
│   ├── FEATURES.md               # Feature list (PLANNED)
│   ├── archive/                  # Completed feature docs
│   └── migrations/               # Migration guides
├── tests/                        # Test files (PLANNED)
│   ├── unit/
│   └── integration/
├── scripts/
│   ├── migrate-favorites.js
│   └── cleanup-thumbnails.js
├── package.json
├── .env.example
└── README.md
```

### Technology Stack

| Component | Technology | Version | Status |
|-----------|-----------|---------|--------|
| Runtime | Node.js | 16+ | ✅ Active |
| Framework | Express.js | 4.18.2 | ✅ Active |
| Database | MySQL/MariaDB | 5.7+ / 10.3+ | ✅ Active |
| ORM/Query | Raw SQL | - | ⚠️ Consider migration to Sequelize/Knex |
| Frontend | AngularJS | 1.x | 🚨 EOL (need Vue 3 / React) |
| Templating | Pug | 3.x | ✅ Active |
| Image Processing | Sharp | 0.34.5 | ✅ Active |
| Video Processing | FFmpeg + fluent-ffmpeg | 2.1.3 | ✅ Active |
| Auto-tagging | GraphicsMagick | - | ✅ Active |
| Logging | Winston | 3.11.0 | ⚠️ Configured but underused |
| Security | Helmet | 7.1.0 | ⚠️ Installed but not configured |
| Testing | (none) | - | 🚨 0% coverage |

---

## Current Known Issues

### 🚨 CRITICAL (Fix Before Major Work)

1. **No Test Suite** - 0% coverage blocks refactoring
2. **AngularJS End-of-Life** - Security liability
3. **Inconsistent Logging** - 60+ `console.log()` calls
4. **Exposed Error Details** - Stack traces sent to clients
5. **No Input Validation** - Scattered in controllers

**→ See [PROJECT_REVIEW.md](../PROJECT_REVIEW.md) for detailed analysis**

### ⚠️ HIGH PRIORITY (Next Sprint)

- No error handling middleware
- Security headers not configured
- No API documentation
- Metadata in JSON files (hard to query)
- Mixed async patterns (callbacks + async/await)
- Database library outdated (`mysql` → `mysql2/promise`)

---

## Common Development Tasks

### Adding a New Feature

1. **Plan the feature** - What endpoints? What database changes?
2. **Database schema** (if needed)
   ```sql
   -- sql/migration_vX_to_vX.1_feature_name.sql
   ALTER TABLE photos ADD COLUMN new_field VARCHAR(255) NULL;
   ```
3. **Model** (`app/models/photoModel.js`)
   ```javascript
   static async getPhotosByFeature(featureName) {
     const sql = 'SELECT * FROM photos WHERE feature = ?';
     return await query(sql, [featureName]);
   }
   ```
4. **Controller** (`app/controllers/photoController.js`)
   ```javascript
   export function getByFeature(req, res) {
     const name = req.query.name;
     Photo.getPhotosByFeature(name, (err, photos) => {
       res.json(photos);
     });
   }
   ```
5. **Routes** (`server-photos.js` or `app/routes/photos.js`)
   ```javascript
   app.get('/api/photos/feature', photoController.getByFeature);
   ```
6. **Test** - Manual browser test or API call via curl
7. **Commit** - Use conventional commit: `feat: add feature_name`

### Adding an API Endpoint

1. Add route handler to controller
2. Add route to `server-photos.js`
3. Add curl example to `docs/API.md` (when created)
4. Test with curl: `curl http://localhost:8082/api/endpoint`

### Fixing a Bug

1. Reproduce locally with clear steps
2. Find the problematic code
3. Add logging (use logger adapter when available)
4. Fix the code
5. Test the fix
6. Commit: `fix: brief description of bug`

### Database Schema Changes

1. **Never modify existing SQL migration files** - create a new one
2. **Create new migration file:** `sql/migration_vX_to_vX.1_change.sql`
3. **Keep migrations incremental** - one feature per file
4. **Update DEPLOYMENT_CHECKLIST.md** with new migration step
5. **Update model files** to use new schema
6. **Test migration** on dev database before pushing

---

## Testing (When Implemented)

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run specific test file
npm test -- photoModel.test.js

# Watch mode (re-run on file changes)
npm test -- --watch

# Integration tests only
npm test -- --testPathPattern=integration
```

---

## Debugging

### Enable Verbose Logging

```javascript
// In server-photos.js or any controller:
import logger from './app/config/logger.js';
logger.debug('Event name', { data: value });
```

### Check Database Connection

```bash
# From project directory:
node -e "import('./app/models/db.js').then(m => m.query('SELECT 1')).then(console.log).catch(console.error)"
```

### Monitor File Changes

```bash
# Watch for thumbnail generation
ls -la temp-pic/ | grep -c "\.jpg$"

# Monitor cache
cat cache/album-cache.json | jq '.length'
```

### API Debugging with curl

```bash
# Get all photos
curl http://localhost:8082/api/photos

# Get specific photo
curl http://localhost:8082/api/photos/123

# Create photo (if endpoint exists)
curl -X POST http://localhost:8082/api/photos \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'

# Check server is running
curl http://localhost:8082/
```

---

## Deployment

### Pre-Deployment Checklist

- [ ] All tests pass: `npm test`
- [ ] No console.log calls (use logger)
- [ ] Error handling middleware applied
- [ ] Input validation added
- [ ] Database migration tested on dev
- [ ] Documentation updated
- [ ] Security headers configured for production

### Deploy to Production

1. Backup current database: `mysqldump -u root -p mydb > backup_$(date +%Y%m%d).sql`
2. Run migration: `mysql -u root -p mydb < sql/migration_new.sql`
3. Update `.env` for production (different DB, secrets, etc.)
4. Restart server: `npm start`
5. Verify: `curl https://production-server/api/photos`

**See:** [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) for full procedure

---

## Performance Tips

1. **Database Queries** - Use indexes on frequently-queried columns (tags, albums, dates)
2. **Thumbnails** - Cache generated thumbnails in `temp-pic/` with hash-based filenames
3. **API Responses** - Use pagination: `?page=1&limit=20`
4. **Frontend** - AngularJS is slower than modern frameworks; consider Vue.js migration
5. **Image Processing** - Process large images asynchronously; don't block server

---

## Security Best Practices

1. **Never commit credentials** - Use `.env` and `.gitignore`
2. **Validate all inputs** - Use validators middleware (when implemented)
3. **Use parameterized queries** - All database queries already do this ✅
4. **Set security headers** - Configure Helmet middleware (PLANNED)
5. **Rate limit** - Prevent abuse of API endpoints (library installed, not configured)
6. **Log security events** - Use logger for auth attempts, access violations
7. **Keep dependencies updated** - Run `npm audit` regularly

---

## Contributing Guidelines

1. **Branch naming:** `feature/feature-name` or `fix/bug-name`
2. **Commit message:** Follow conventional commits (`feat:`, `fix:`, `refactor:`, etc.)
3. **Code style:** Use existing patterns in the codebase (ES6 modules, async/await where possible)
4. **Testing:** Run `npm test` before submitting PR
5. **Documentation:** Update relevant docs when changing behavior

---

## Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests (when implemented)
npm test

# Check for vulnerabilities
npm audit

# Update dependencies (be careful)
npm update

# List installed packages
npm list

# Clear node_modules and reinstall
rm -rf node_modules && npm install

# Check what would be deployed
npm list --production

# Generate production bundle (if webpack added later)
npm run build
```

---

## Troubleshooting

### Server won't start
```bash
# Check if port 8082 is already in use
lsof -i :8082        # macOS/Linux
netstat -ano | findstr :8082  # Windows

# Check database connection
mysql -u root -p -e "SELECT 1"

# Check logs
tail -f logs/application.log
```

### Database migration fails
```bash
# Restore from backup
mysql -u root -p mydb < backup_YYYYMMDD.sql

# Check current schema
mysql -u root -p mydb -e "SHOW TABLES;"
```

### Thumbnails not generating
```bash
# Check temp-pic directory permissions
ls -la temp-pic/

# Check mediaService logs
grep -i "thumbnail" logs/application.log
```

---

## Next Steps (Prioritized)

1. **Phase 1 (This Week)** - Stabilize
   - Add Jest test framework
   - Implement error handling middleware
   - Add input validation
   - Standardize logging

2. **Phase 2 (Next Week)** - Modernize
   - Refactor async patterns
   - Update database library
   - Move metadata to database
   - Configure security properly

3. **Phase 3** - Enhance
   - Add API documentation
   - Implement rate limiting
   - Add comprehensive logging

4. **Phase 4** - Migrate Frontend
   - Plan Vue 3 or React migration
   - Gradual component porting
   - Retire AngularJS

---

**Last Updated:** June 11, 2026  
**For Issues:** See [PROJECT_REVIEW.md](../PROJECT_REVIEW.md)  
**For Action Plan:** See [QUICK_START_CRITICAL_FIXES.md](../QUICK_START_CRITICAL_FIXES.md)

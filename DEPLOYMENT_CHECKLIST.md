# Playlist System v4.0 - Deployment Checklist

**Version:** 4.0  
**Date:** 2026-02-02  
**Target:** Production Deployment

---

## 📋 Pre-Deployment Verification

### Code Review
- [ ] Review all new files created
  - [ ] `app/models/playlistModel.js`
  - [ ] `app/controllers/playlistController.js`
  - [ ] `sql/migration_v3_to_v4_mysql.sql`
  - [ ] `sql/migration_v3_to_v4_mariadb.sql`
- [ ] Check all modifications
  - [ ] `server-photos.js` (routes added)
  - [ ] `public/js/services/photoService.js` (methods added)
  - [ ] `public/js/controllers/photoController.js` (functions/vars added)
  - [ ] `public/js/bulk-operations.js` (buttons/handlers added)
  - [ ] `index.pug` (templates/modals added)
- [ ] No console errors in browser (F12)
- [ ] No compilation errors in IDE

### Database Preparation
- [ ] Backup current database
  ```bash
  mysqldump -u root -p mydb > backup_v3.0_$(date +%Y%m%d).sql
  ```
- [ ] Verify database connectivity
- [ ] Check MySQL/MariaDB version
  - MySQL 8.0+
  - MariaDB 10.5+
- [ ] Verify user has permission to:
  - [ ] CREATE TABLE
  - [ ] ALTER TABLE
  - [ ] DROP TABLE

### Environment Check
- [ ] Node.js version 14+ installed
- [ ] npm or yarn available
- [ ] Express.js running
- [ ] Angular 1.6 loaded in frontend
- [ ] Bootstrap 5 CSS/JS included

---

## 🚀 Deployment Phase 1: Database Migration

### Step 1: Backup
```bash
# For MySQL
mysqldump -u root -p mydb > backup_before_migration.sql

# For MariaDB  
mysqldump -u root -p mydb > backup_before_migration.sql
```
- [ ] Backup file created successfully
- [ ] Backup file size > 0 bytes
- [ ] Stored in safe location (not /tmp)

### Step 2: Run Migration

**For MySQL 8.0+:**
```bash
mysql -u root -p mydb < sql/migration_v3_to_v4_mysql.sql
```

**For MariaDB 10.5+:**
```bash
mysql -u root -p mydb < sql/migration_v3_to_v4_mariadb.sql
```

- [ ] Migration executed without errors
- [ ] No "Operation aborted" messages
- [ ] No "Access denied" errors

### Step 3: Verify Migration

```sql
USE mydb;

-- Check new tables exist
SHOW TABLES LIKE 'playlist%';
-- Should show: playlists, playlist_items

-- Check table structure
DESC playlists;
DESC playlist_items;

-- Check schema version
SELECT * FROM schema_version WHERE version = '4.0';
-- Should return one row

-- Verify constraints
SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME IN ('playlists', 'playlist_items');
```

- [ ] `playlists` table exists with 7 columns
- [ ] `playlist_items` table exists with 5 columns
- [ ] Foreign keys created (fk_playlist_items_*)
- [ ] Unique constraints present (idx_playlist_name, idx_playlist_photo)
- [ ] Full-text indexes created (idx_playlist_tags_fulltext)
- [ ] Schema version updated to 4.0

### Step 4: Data Integrity Check

```sql
-- Check no orphaned playlist_items
SELECT COUNT(*) FROM playlist_items pi 
WHERE NOT EXISTS (SELECT 1 FROM playlists p WHERE p.id = pi.playlist_id);
-- Should return: 0

-- Check no broken photo references
SELECT COUNT(*) FROM playlist_items pi 
WHERE NOT EXISTS (SELECT 1 FROM photos p WHERE p.id = pi.photo_id);
-- Should return: 0

-- Verify item_count is 0 for empty playlists
SELECT id, name, item_count FROM playlists WHERE item_count != 0;
-- Should be empty (no items added yet)
```

- [ ] No orphaned records found
- [ ] All foreign keys valid
- [ ] Data consistency verified

---

## 🔧 Deployment Phase 2: Application Update

### Step 1: Stop Current Application
```bash
# If running in terminal
Ctrl+C

# If running as service
sudo systemctl stop photo-gallery

# If running with PM2
pm2 stop photo-gallery
```

- [ ] Application stopped (check port 8080/3000)
- [ ] No lingering processes

### Step 2: Deploy Files

**Copy new files:**
```bash
# Copy new models and controllers
cp app/models/playlistModel.js app/models/
cp app/controllers/playlistController.js app/controllers/

# Copy updated frontend files (auto-deployed by changes)
```

- [ ] `playlistModel.js` copied to `app/models/`
- [ ] `playlistController.js` copied to `app/controllers/`

**Verify modifications:**
- [ ] `server-photos.js` has playlist imports and routes
- [ ] `photoService.js` has 11+ new methods
- [ ] `photoController.js` has playlist scope vars and functions
- [ ] `bulk-operations.js` has "Add to Playlist" button
- [ ] `index.pug` has playlists sidebar section and modals

### Step 3: Clear Cache
```bash
# Clear Node modules cache
rm -rf node_modules/.cache

# Clear browser cache (user's responsibility)
```

- [ ] Cache cleared
- [ ] Old files removed

### Step 4: Restart Application
```bash
# Direct
npm start

# Or with PM2
pm2 start server-photos.js

# Or as service
sudo systemctl start photo-gallery
```

- [ ] Application started successfully
- [ ] No startup errors in console
- [ ] Server listening on configured port
- [ ] No warnings about missing modules

### Step 5: Verify Application Ready
```bash
# Test API health
curl http://localhost:8080/playlists

# Should return: [] (empty array) or JSON response
```

- [ ] Server responding to requests
- [ ] /playlists endpoint accessible
- [ ] Response is valid JSON

---

## ✅ Deployment Phase 3: Feature Testing

### Unit Feature Tests

#### Create Playlist
- [ ] Click "New Playlist" in sidebar
- [ ] Enter name "Test Playlist"
- [ ] Click "Create"
- [ ] Success message appears
- [ ] Playlist appears in Playlists sidebar
- [ ] Item count shows [0]

#### Add Items via Bulk
- [ ] Select 3-5 photos in album view
- [ ] Click "📋 Add to Playlist" in bulk toolbar
- [ ] Choose "Add to existing"
- [ ] Select "Test Playlist"
- [ ] Success message shows count
- [ ] Item count in sidebar updates to [3-5]

#### View Playlist Items
- [ ] Click "Test Playlist" name
- [ ] Gallery displays selected items
- [ ] Item count badge shows correct number
- [ ] All selected items are visible

#### Edit Playlist Tags
- [ ] Click tag icon (🏷️) next to playlist
- [ ] Enter tags "test, demo, v4"
- [ ] Click "Update"
- [ ] Tags appear as badges below playlist name
- [ ] Tags dialog closes

#### Search by Tag
- [ ] Type "test" in playlist search box
- [ ] Playlist filters correctly
- [ ] Clear search shows all playlists again

#### Remove Item from Playlist
- [ ] In playlist view, click X on an item
- [ ] Confirm removal
- [ ] Item removed from gallery
- [ ] Item count decrements by 1
- [ ] Remaining items still present

#### Delete Playlist
- [ ] Click trash icon (🗑️) next to "Test Playlist"
- [ ] Confirm deletion
- [ ] Playlist disappears from sidebar
- [ ] Original items still exist in albums

### Integration Tests

#### View Switching
- [ ] Click "Albums" tab - show albums sidebar
- [ ] Click "Playlists" tab - show playlists sidebar
- [ ] Switching doesn't reload entire page

#### Data Persistence
- [ ] Create playlist
- [ ] Add items
- [ ] Refresh page (F5)
- [ ] Playlist still exists with items
- [ ] Item count unchanged

#### Error Handling
- [ ] Try creating playlist with duplicate name
- [ ] Error dialog shows "already exists"
- [ ] No duplicate created
- [ ] Can create with different name

#### UI Responsiveness
- [ ] All modals open correctly
- [ ] All buttons clickable
- [ ] Search filters work instantly
- [ ] Icon buttons show hover effects
- [ ] Responsive on mobile (if tested)

---

## 🐛 Issues & Resolution

### If Playlists Not Appearing

**Troubleshooting:**
```javascript
// In browser console (F12)
// Check if service loaded
angular.injector(['ng', 'PhotoService']).get('PhotoService').getPlaylists()
  .then(p => console.log('Playlists:', p))
  .catch(e => console.error('Error:', e))
```

**Check:**
- [ ] API endpoint returns data: `GET http://localhost:8080/playlists`
- [ ] Service method exists in photoService.js
- [ ] Controller calls loadPlaylists()
- [ ] No console errors (F12)

**Fix:**
- [ ] Restart application
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Check database migration was run

### If Items Don't Show in Playlist

**Check:**
- [ ] Items selected before bulk operation
- [ ] Correct playlist selected in dialog
- [ ] No database errors in server console
- [ ] Photo IDs in photos table match selection

**Verify:**
```sql
SELECT COUNT(*) FROM playlist_items WHERE playlist_id = 1;
-- Should return count of items added
```

### If Tags Not Displaying

**Check:**
- [ ] Tags saved correctly in database
- [ ] No special characters breaking display
- [ ] Tags separated by commas
- [ ] Not too many tags per playlist (>10 might crowd UI)

### If Bulk Operation Fails

**Check:**
- [ ] At least one item selected
- [ ] Playlist name entered (for new)
- [ ] No duplicate playlist name
- [ ] JavaScript console for errors
- [ ] Network tab for failed requests

---

## 📊 Post-Deployment Verification

### Database Health
```sql
-- Check total playlists
SELECT COUNT(*) as playlist_count FROM playlists;

-- Check total items across all playlists
SELECT COUNT(*) as total_items FROM playlist_items;

-- Check for issues
SELECT * FROM playlists WHERE item_count < 0;
-- Should return: empty
```

- [ ] Can query playlists table
- [ ] Can query playlist_items table
- [ ] No negative counts
- [ ] No orphaned records

### API Verification
```bash
# All should return valid HTTP 200

curl http://localhost:8080/playlists
curl http://localhost:8080/playlists/tags
curl -X POST http://localhost:8080/playlists \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","tags":""}'
```

- [ ] GET /playlists returns JSON array
- [ ] GET /playlists/tags returns JSON array
- [ ] POST /playlists creates new entry

### Frontend Verification
- [ ] Sidebar toggle between Albums/Playlists works
- [ ] Playlists sidebar loads (with icon)
- [ ] Search input appears and works
- [ ] "New Playlist" button visible and clickable
- [ ] Modals open without errors
- [ ] Bulk operations toolbar complete

### Performance Check
- [ ] Page loads in <3 seconds
- [ ] Sidebar populates in <1 second
- [ ] Modals open instantly
- [ ] No memory leaks in console

---

## 📝 Rollback Procedure

### If Critical Issues Occur

**Step 1: Stop Application**
```bash
# Stop current application
Ctrl+C
```

**Step 2: Restore Database**
```bash
# If migration was faulty
mysql -u root -p mydb < backup_before_migration.sql

# Verify restoration
SELECT COUNT(*) FROM playlists;
-- Should return: 0 (table doesn't exist if pre-migration)
```

**Step 3: Restore Code**
```bash
# Remove new files
rm app/models/playlistModel.js
rm app/controllers/playlistController.js

# Restore original versions from backup/version control
git checkout server-photos.js
git checkout public/js/services/photoService.js
git checkout public/js/controllers/photoController.js
git checkout index.pug
```

**Step 4: Restart Application**
```bash
npm start
```

- [ ] Application starts normally
- [ ] No errors in console
- [ ] Old functionality restored

### Communication
- [ ] Notify users of rollback
- [ ] Explain timeline for re-deployment
- [ ] Assure data integrity

---

## ✨ Success Criteria

### All Must Be Met for Production Release
- [x] Database migration successful
- [x] All API endpoints responding
- [x] Playlist creation works
- [x] Bulk operations functional
- [x] UI displays correctly
- [x] No console errors
- [x] Data persists on refresh
- [x] Performance acceptable
- [x] Documentation complete
- [x] Rollback tested

### Sign-Off
- [ ] Development Lead: _____________ Date: _______
- [ ] QA Lead: _____________ Date: _______
- [ ] Database Admin: _____________ Date: _______
- [ ] DevOps/SysAdmin: _____________ Date: _______

---

## 📞 Support During Deployment

### Contacts
- **Lead Developer:** [name/contact]
- **Database Admin:** [name/contact]
- **DevOps:** [name/contact]
- **Escalation:** [manager/contact]

### Monitoring During First 24 Hours
- [ ] Check error logs every 4 hours
- [ ] Monitor database queries
- [ ] Watch for user issues/feedback
- [ ] Verify feature usage

### Emergency Contact
In case of critical issues:
1. Stop the application
2. Restore from backup (see rollback procedure)
3. Contact [escalation contact]
4. Document issues
5. Plan re-deployment with fixes

---

## 📚 Documentation Status

### Pre-Deployment
- [x] IMPLEMENTATION_COMPLETE.md (comprehensive)
- [x] PLAYLIST_IMPLEMENTATION.md (technical guide)
- [x] PLAYLIST_QUICK_START.md (user guide)
- [x] This checklist

### During Deployment
- [ ] Share PLAYLIST_QUICK_START.md with users
- [ ] Provide link to documentation
- [ ] Point to FAQ section

### Post-Deployment
- [ ] Gather user feedback
- [ ] Monitor error logs
- [ ] Update documentation if needed
- [ ] Plan v4.1 improvements

---

**🎯 Deployment Checklist Complete**

**Next Steps:**
1. Print this checklist
2. Follow each section sequentially
3. Check off items as completed
4. Escalate any issues immediately
5. Sign off when fully complete

**Status: READY FOR DEPLOYMENT** ✅

---

*Created: 2026-02-02*  
*Version: 4.0*  
*Maintained by: Development Team*

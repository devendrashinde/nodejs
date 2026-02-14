# Image Editor - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Server running: `npm start` or `node server-photos.js`
- Database: MySQL/MariaDB with photo gallery
- Photos in gallery with known photo IDs

## Step 1: Execute Database Migration (2 minutes)

Open terminal/command prompt:

```bash
# Windows
mysql -u your_user -p your_database < sql/migration_v2_to_v2.1_image_editing.sql

# Linux/Mac
mysql -u your_user -p your_database < sql/migration_v2_to_v2.1_image_editing.sql
```

When prompted, enter your MySQL password.

**Expected output**: No errors, query OK messages

**Verify success**:
```bash
mysql -u your_user -p your_database

# In MySQL prompt:
mysql> SHOW TABLES LIKE 'photo_editions';

# Should show: photo_editions table

mysql> DESCRIBE photos;

# Should show new columns: width, height, file_size, date_taken

mysql> EXIT;
```

### Step 2: Verify Server Configuration (1 minute)

Check that server files are in place:

```bash
# From project root directory
ls app/controllers/imageEditingController.js
ls app/services/imageEditingService.js
ls app/routes/imageEditingRoutes.js
ls public/js/image-editor.js
```

All files should exist.

**Check server-photos.js**:

Open `server-photos.js` and look for:
```javascript
// Line ~13: should have
const imageEditingRoutes = require('./app/routes/imageEditingRoutes');

// Line ~74: should have
app.use('/api', imageEditingRoutes);
```

### Step 3: Restart Server (1 minute)

Stop the current server (Ctrl+C):
```bash
# Wait for clean shutdown
```

Start the server again:
```bash
npm start
# or
node server-photos.js
```

**Expected output**:
```
Server running on port 3000
Database connected
```

### Step 4: Test in Browser (1 minute)

1. **Open browser**: http://localhost:3000

2. **Click any photo** to open Fancybox lightbox

3. **Look for toolbar buttons** at bottom of image

4. **Find the edit button** (pencil icon) 
   - Should be between heart (favorite) and list (playlist) icons

5. **Click the edit button** ✏️

6. **Editor modal should open** with:
   - Image preview on the left
   - Tool buttons: Crop, Rotate, Resize, Flip
   - Version history on the right

## ✅ Functionality Test

### Test Rotate (Easiest)
```
1. Keep edit modal open from Step 4
2. Click "🔄 Rotate" button
3. Three buttons appear: 90°, 180°, 270°
4. Click "90°"
5. Confirmation dialog: Click OK
6. Loading spinner appears
7. Image should rotate in preview
8. Right panel shows: v2 marked as "Current"
9. Successfully created version 2!
```

### Test Resize (With feedback)
```
1. Click "📏 Resize" button
2. Width and Height fields appear with current dimensions
3. Change Width to 800 (smaller)
4. Height auto-adjusts
5. Click "✅ Apply Resize"
6. Confirm dialog
7. New version created - v3 now current
```

### Test Restore
```
1. Right panel shows version history
2. Find v1 (original) or v2 in the list
3. Click "↩️ Restore" button on one of old versions
4. Confirm dialog
5. That version becomes current
6. Badge updates in version list
```

### Test Crop (Most features)
```
1. Click "✂️ Crop" button
2. Input fields appear:
   X: (top-left X coordinate)
   Y: (top-left Y coordinate)
   Width: (crop box width)
   Height: (crop box height)
3. Enter example values:
   X: 0
   Y: 0
   Width: 400
   Height: 300
4. Click "✅ Apply Crop"
5. Confirm dialog
6. New version with cropped image created
```

## 🐛 Troubleshooting

### Edit button not showing?
```bash
# Check browser console (F12)
# Look for errors about image-editor.js

# Verify file exists:
ls public/js/image-editor.js

# Check index.pug has script reference:
grep "image-editor.js" index.pug
```

### Modal opens but blank?
```bash
# Check console (F12) for API errors
# Common issues:
# - Photo doesn't have ID in database
# - database migration not executed
# - API routes not mounted in server

# Test API directly:
curl http://localhost:3000/api/photos/1/versions
# Should return JSON with versions array
```

### Changes not saving?
```bash
# Check database has table:
mysql -u user -p database
mysql> SELECT * FROM photo_editions;
mysql> EXIT;

# Check file permissions on photo directories
# Sharp needs write access to save edited files
```

### Photos don't show in preview?
```bash
# Check photo path is correct
# Verify image files are readable
# Check browser console for image load errors

# Common fix: Clear browser cache (Ctrl+Shift+Delete)
```

## 📊 Verify Success

After completing all steps, you should see:

✅ Edit button in Fancybox toolbar
✅ Image editor modal opens
✅ Image preview displays
✅ Version history lists versions
✅ Rotate creates new version
✅ Versions persist after page reload
✅ Can restore previous versions
✅ Can delete secondary versions (not original)

## 🎯 What to Explore Next

### Features You Can Use Immediately
- **Rotate images** - Most stable operation
- **Resize images** - Full-featured with fit options
- **Flip images** - Simple and quick
- **View version history** - See all edits ever made
- **Restore versions** - Revert to any previous state

### Data Your Photos Now Have
- Width & Height dimensions
- File size for each version
- Edit history (what was done and when)
- Version numbering (v1, v2, v3, etc.)

## 💡 Tips for Best Results

1. **Start with Rotate**: Simplest operation to verify everything works

2. **Small Images First**: Test with smaller images before large ones

3. **Watch Progress Spinner**: Wait for it to disappear before taking next action

4. **Version Limits**: You can create unlimited versions (but they occupy disk space)

5. **Restore Anytime**: Always safe to restore to original

## 📋 Feature Overview

| Feature | Status | Description |
|---------|--------|-------------|
| **Crop** | ✅ Ready | Crop to specific region |
| **Rotate** | ✅ Ready | 90°, 180°, 270° rotation |
| **Resize** | ✅ Ready | Change dimensions with fit options |
| **Flip** | ✅ Ready | Mirror horizontal or vertical |
| **Versions** | ✅ Ready | Full version history tracking |
| **Restore** | ✅ Ready | Revert to any previous version |
| **Delete** | ✅ Ready | Remove versions (except original) |
| **Metadata** | ✅ Ready | See image dimensions |
| **Canvas Preview** | ⏳ Planned | Show crop area before applying |
| **Filters** | ⏳ Planned | Brightness, contrast, saturation |
| **Batch Edits** | ⏳ Planned | Apply same edit to multiple photos |

## 🔒 Safety Features

- ✅ **Non-destructive**: Original never modified
- ✅ **Reversible**: Restore to original anytime
- ✅ **Confirmed**: Each edit requires confirmation
- ✅ **Logged**: All edits tracked in database
- ✅ **Backed up**: Original file always preserved

## 📞 Getting Help

### Check Server Logs
```bash
# Server logs appear in terminal running npm start
# Look for: [error], [ERROR], or red text
```

### Enable Debug Mode
```bash
# Set environment variable before starting
# Windows:
set DEBUG=*
npm start

# Linux/Mac:
DEBUG=* npm start
```

### Test API Endpoints Directly
```bash
# Test if API is working
curl http://localhost:3000/api/photos/1/versions

# Should return:
# {"success":true,"versions":[...]}
```

### Database Check
```bash
mysql -u user -p database
mysql> SELECT COUNT(*) FROM photo_editions;
mysql> SELECT COUNT(*) FROM photos WHERE id = 1;
mysql> EXIT;
```

## ✨ Next Actions

1. **If everything works**: 
   - Start editing photos!
   - Try all four operations
   - Create a few versions for testing

2. **If you encounter issues**:
   - Check troubleshooting above
   - Check server logs
   - Verify database migration executed

3. **When ready for production**:
   - Backup database and photo files
   - Review version history usage
   - Monitor disk space for old versions

## 🎊 Success Checklist

- [ ] Database migration executed without errors
- [ ] Server started successfully
- [ ] Edit button visible in Fancybox
- [ ] Editor modal opens
- [ ] Image preview displays
- [ ] Rotate operation works
- [ ] Resize operation works
- [ ] Version history updates
- [ ] Can restore to previous version
- [ ] Ready for production use

**Congratulations!** Your Image Editor is now fully operational. 🎉

For detailed information, see:
- `IMAGE_EDITOR_INTEGRATION_COMPLETE.md` - Full architecture guide
- `IMAGE_EDITOR_FRONTEND_IMPLEMENTATION.md` - UI/UX details
- `sql/migration_v2_to_v2.1_image_editing.sql` - Database schema


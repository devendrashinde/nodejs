# Favorites Feature - Developer Quick Reference

## File Summary

### Database
- **sql/favorites.sql** - Schema definition
- **scripts/migrate-favorites.js** - Migration script

### Backend
- **app/controllers/advancedFeaturesController.js** - API handlers
- **app/routes/advancedFeaturesRoutes.js** - Route definitions

### Frontend
- **public/js/controllers/photoController.js** - Controller logic
- **index.pug** - UI template
- **public/main.css** - Styling

## Key Functions

### Backend

#### toggleFavorite(req, res)
Saves/removes favorite to database
```javascript
POST /api/photos/:id/favorite
Body: { isFavorite: true/false }
```

#### getUserFavorites(req, res)
Gets all user's favorites
```javascript
GET /api/favorites
Response: { success: true, count: N, favorites: [] }
```

#### checkFavorite(req, res)
Checks if photo is favorited
```javascript
GET /api/favorites/check/:path
Response: { success: true, isFavorite: boolean }
```

#### getFavoritesByAlbum(req, res)
Gets favorites for album
```javascript
GET /api/favorites/album/:album
Response: { success: true, count: N, favorites: [] }
```

### Frontend

#### loadUserFavorites()
Auto-loads favorites and marks photos
```javascript
Called in: getPhotos() after photo load
Sets: image.isFavorite = true/false
```

#### toggleFavorite(image)
Handles UI click to toggle favorite
```javascript
Calls: POST /api/photos/{path}/favorite
Updates: image.isFavorite property
```

## Code Changes

### Backend Controllers
```javascript
// File: app/controllers/advancedFeaturesController.js
// Lines: 295-338 (toggleFavorite)
// Lines: 340-398 (new getUserFavorites, checkFavorite, getFavoritesByAlbum)
```

### Backend Routes
```javascript
// File: app/routes/advancedFeaturesRoutes.js
// Lines: 13-30 (import new functions)
// Lines: 149-170 (new route handlers)
```

### Frontend Controller
```javascript
// File: public/js/controllers/photoController.js
// Lines: 79-94 (modified getPhotos with loadUserFavorites)
// Lines: 102-133 (new loadUserFavorites function)
```

## Database Queries

### Insert/Update
```sql
INSERT INTO favorites (user_id, photo_path, photo_name, album)
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE created_at = NOW()
```

### Delete
```sql
DELETE FROM favorites WHERE user_id = ? AND photo_path = ?
```

### Select All
```sql
SELECT * FROM favorites 
WHERE user_id = ? 
ORDER BY created_at DESC
```

### Select by Album
```sql
SELECT * FROM favorites 
WHERE user_id = ? AND album = ? 
ORDER BY created_at DESC
```

### Check Exists
```sql
SELECT id FROM favorites 
WHERE user_id = ? AND photo_path = ?
```

## Configuration

### User ID (in all endpoints)
```javascript
const userId = req.user?.id || req.session?.userId || 'guest';
```

Change the fallback chain based on your auth system:
- Remove `|| 'guest'` if you require authentication
- Change `'guest'` to another default if needed

### Path Validation
```javascript
if (photoPath.includes('..') || photoPath.startsWith('/')) {
    return res.status(400).json({ error: 'Invalid photo path' });
}
```

## Testing Queries

```javascript
// Test all favorites
GET http://localhost:8082/api/favorites

// Test toggle (assuming photo at data/pictures/test.jpg)
POST http://localhost:8082/api/photos/data%2Fpictures%2Ftest.jpg/favorite
Body: { isFavorite: true }

// Test album favorites
GET http://localhost:8082/api/favorites/album/pictures

// Test check
GET http://localhost:8082/api/favorites/check/data%2Fpictures%2Ftest.jpg
```

## Common Tasks

### Add new user ID type
**File:** `app/controllers/advancedFeaturesController.js` (all 4 functions)

Change:
```javascript
const userId = req.user?.id || req.session?.userId || 'guest';
```

To:
```javascript
const userId = req.user?.id || req.session?.userId || req.headers['x-user-id'] || 'guest';
```

### Add authentication middleware
Add this to routes before favorite endpoints:
```javascript
// Require auth for favorites
router.get('/favorites', requireAuth, getUserFavorites);
```

### Add soft delete (optional)
Add `deleted_at` column and modify queries:
```sql
ALTER TABLE favorites ADD deleted_at TIMESTAMP NULL;

-- Then modify SELECT queries:
WHERE user_id = ? AND deleted_at IS NULL
```

### Add limits/quotas
Track favorite count per user:
```javascript
const countSql = `SELECT COUNT(*) as count FROM favorites WHERE user_id = ?`;
const result = await query(countSql, [userId]);
if (result[0].count >= MAX_FAVORITES) {
    return res.status(429).json({ error: 'Favorite limit reached' });
}
```

## API Response Formats

### Success (200)
```javascript
{ 
  success: true,
  count: 5,
  favorites: [...],
  message: "Operation successful"
}
```

### Error (400/500)
```javascript
{ 
  error: "Invalid photo path",
  status: 400
}
```

## Migration & Setup

### First Time Setup
```bash
cd c:\MyData\photos
node scripts/migrate-favorites.js
npm run dev
```

### Backup Before Upgrade
```sql
CREATE TABLE favorites_backup AS SELECT * FROM favorites;
```

### Rollback if Needed
```sql
DROP TABLE favorites;
RENAME TABLE favorites_backup TO favorites;
```

## Performance Tips

1. **Indexes** - Already on user_id, album, created_at
2. **Caching** - Consider caching user's favorites in memory
3. **Pagination** - Add LIMIT/OFFSET for large lists
4. **Batch Operations** - Favorite multiple photos in one request

### Pagination Example
```javascript
const limit = 50;
const offset = (page - 1) * limit;
const sql = `SELECT * FROM favorites WHERE user_id = ? 
             ORDER BY created_at DESC LIMIT ? OFFSET ?`;
const results = await query(sql, [userId, limit, offset]);
```

## Debugging

### Check Database
```sql
-- View all favorites
SELECT * FROM favorites;

-- View specific user
SELECT * FROM favorites WHERE user_id = 'guest';

-- Count per album
SELECT album, COUNT(*) FROM favorites GROUP BY album;

-- Check for duplicates
SELECT user_id, photo_path, COUNT(*) 
FROM favorites 
GROUP BY user_id, photo_path 
HAVING COUNT(*) > 1;
```

### Check Logs
```javascript
// Enable detailed logging
console.log('User:', userId);
console.log('Photo Path:', photoPath);
console.log('Query:', sql);
console.log('Result:', result);
```

### Browser Console
```javascript
// Check loaded photos
$scope.photos.filter(p => p.isFavorite).length

// Check single photo
$scope.photos.find(p => p.name === 'photo.jpg')

// Manually call loadUserFavorites
$scope.loadUserFavorites()
```

## Monitoring

### Add metrics collection
```javascript
const startTime = Date.now();
const result = await query(sql, params);
const duration = Date.now() - startTime;
console.log(`Query took ${duration}ms`);
```

### Track API usage
```javascript
export const getUserFavorites = async (req, res) => {
    const userId = req.user?.id || 'guest';
    const startTime = Date.now();
    // ... query code ...
    const duration = Date.now() - startTime;
    res.set('X-Response-Time', duration);
    res.json({ ... });
};
```

---

**Quick Links:**
- [Full Documentation](FAVORITES_FEATURE.md)
- [Implementation Summary](FAVORITES_IMPLEMENTATION.md)
- [Testing Guide](FAVORITES_TESTING.md)
- [Database Schema](sql/favorites.sql)

# Favorites Feature Documentation

## Overview
The favorites feature allows users to mark photos as favorites. Favorites are persisted to the database and are specific to each user (currently using "guest" user ID for anonymous users).

## Database Schema

### favorites Table
```sql
CREATE TABLE favorites (
  id int NOT NULL AUTO_INCREMENT,
  user_id varchar(100) DEFAULT 'guest',
  photo_path varchar(1000) NOT NULL,
  photo_name varchar(500) NOT NULL,
  album varchar(500) NOT NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_photo (user_id, photo_path(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Key Fields:**
- `user_id`: User identifier (default: 'guest' for anonymous users)
- `photo_path`: Relative file path to photo (e.g., `data/pictures/nature/photo.jpg`)
- `photo_name`: Filename only (e.g., `photo.jpg`)
- `album`: Album/folder name (e.g., `nature`)
- `created_at`: Timestamp when favorited

**Constraints:**
- Unique constraint on `(user_id, photo_path)` prevents duplicate favorites
- Indexes on `user_id`, `album`, and `created_at` for fast queries

## API Endpoints

### 1. Toggle Favorite
**POST /api/photos/:id/favorite**

Adds or removes a photo from favorites.

**Request:**
```javascript
{
  isFavorite: true // or false
}
```

**Response:**
```javascript
{
  success: true,
  photoPath: "data/pictures/nature/photo.jpg",
  userId: "guest",
  isFavorite: true,
  message: "Added to favorites" // or "Removed from favorites"
}
```

**Example:**
```javascript
$http.post('/api/photos/data%2Fpictures%2Fnature%2Fphoto.jpg/favorite', { 
  isFavorite: true 
})
```

### 2. Get All Favorites
**GET /api/favorites**

Retrieves all favorites for the current user.

**Response:**
```javascript
{
  success: true,
  count: 5,
  favorites: [
    {
      id: 1,
      user_id: "guest",
      photo_path: "data/pictures/nature/photo1.jpg",
      photo_name: "photo1.jpg",
      album: "nature",
      created_at: "2024-02-03T10:30:00.000Z"
    },
    // ... more favorites
  ]
}
```

### 3. Get Favorites for Album
**GET /api/favorites/album/:album**

Retrieves all favorites in a specific album.

**Response:**
```javascript
{
  success: true,
  album: "nature",
  count: 3,
  favorites: [ /* ... */ ]
}
```

### 4. Check if Photo is Favorited
**GET /api/favorites/check/:path**

Checks if a specific photo is in the user's favorites.

**Response:**
```javascript
{
  success: true,
  isFavorite: true,
  photoPath: "data/pictures/nature/photo.jpg",
  userId: "guest"
}
```

## Frontend Integration

### Data Loading
Favorites are automatically loaded when:
1. Page initially loads (via `loadPhotos()`)
2. Album selection changes (via `setAlbum()`)
3. Pagination occurs (via `loadAlbumWithPageId()`)

### Controller Functions

#### toggleFavorite(image)
```javascript
$scope.toggleFavorite = function(image) {
    if (!image.path) return;
    
    const isFavorite = !image.isFavorite;
    const encodedPath = encodeURIComponent(image.path);
    
    $http.post(`/api/photos/${encodedPath}/favorite`, { isFavorite: isFavorite })
        .then(function successCallback(response) {
            image.isFavorite = isFavorite;
            console.log('Favorite toggled:', image.path, isFavorite);
        }, function errorCallback(response) {
            console.error('Error toggling favorite:', response);
            alert('Failed to toggle favorite');
        });
};
```

#### loadUserFavorites()
```javascript
$scope.loadUserFavorites = function() {
    $http.get('/api/favorites')
        .then(function successCallback(response) {
            const favorites = response.data.favorites || [];
            const favoriteMap = {};
            
            // Create a map of favorite photo paths
            favorites.forEach(fav => {
                favoriteMap[fav.photo_path] = true;
            });
            
            // Mark photos as favorites
            $scope.photos.forEach(photo => {
                if (favoriteMap[photo.path]) {
                    photo.isFavorite = true;
                }
            });
        });
};
```

### Template
In `index.pug`, the favorite button:
```pug
button.btn.btn-sm(ng-click='toggleFavorite(image)' ng-class="{'btn-danger': image.isFavorite, 'btn-outline-danger': !image.isFavorite}" title='Add to favorites')
  i.bi.bi-heart(ng-if='!image.isFavorite')
  i.bi.bi-heart-fill(ng-if='image.isFavorite')
```

## User Experience

### Display
- **Unfavorited**: Empty heart outline button
- **Favorited**: Filled red heart button

### Behavior
1. Click heart icon to toggle favorite status
2. Button immediately updates color (optimistic UI)
3. API call saves to database
4. On page refresh, favorited items load with red hearts
5. Can browse by album and see favorites highlighted

## Backend Implementation

### Database Operations
All favorite operations use prepared statements to prevent SQL injection:

```javascript
// Add favorite
const sql = `
    INSERT INTO favorites (user_id, photo_path, photo_name, album)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE created_at = NOW()
`;
await query(sql, [userId, photoPath, photoName, album]);

// Remove favorite
const sql = `DELETE FROM favorites WHERE user_id = ? AND photo_path = ?`;
await query(sql, [userId, photoPath]);

// Get all favorites
const sql = `
    SELECT * FROM favorites 
    WHERE user_id = ? 
    ORDER BY created_at DESC
`;
const results = await query(sql, [userId]);
```

### User ID Handling
The system uses guest user ID fallback:
```javascript
const userId = req.user?.id || req.session?.userId || 'guest';
```

This allows:
- **Authenticated users**: Use actual user ID
- **Session users**: Use session ID
- **Anonymous users**: Default to 'guest' ID

All users can favorite photos, and each gets their own favorites list.

## Migration

To create the favorites table:
```bash
node scripts/migrate-favorites.js
```

Or manually using MySQL:
```sql
mysql -u root -p mydb < sql/favorites.sql
```

## Future Enhancements

### Planned Features
1. **Favorites View** - New gallery view showing only favorited photos
2. **Favorites Export** - Download all favorite photos as ZIP
3. **Favorites Sharing** - Share a collection of favorites with others
4. **Favorites Collections** - Organize favorites into multiple collections
5. **Favorite Sync** - Sync favorites across devices with user accounts
6. **Favorite Statistics** - Show most-favorited photos in gallery

### Implementation Notes
- Favorites are currently user-specific (using guest ID for anonymous)
- No built-in user accounts yet (use session management for this)
- Favorites are permanent until explicitly removed
- No access control on favorites (any user can view own favorites)

## Troubleshooting

### Favorites Not Persisting
1. Check if `migrate-favorites.js` was run
2. Verify database connection in server logs
3. Check browser console for API errors
4. Verify photo path format in database

### Favorites Not Loading on Refresh
1. Ensure `loadUserFavorites()` is called after photos load
2. Check browser console for API errors
3. Verify `isFavorite` property is set on photo objects
4. Hard refresh browser (Ctrl+Shift+R)

### Performance Issues
- Favorites table has indexes on frequently-queried fields
- Photo path lookup uses UNIQUE key constraint
- Results are ordered by `created_at DESC`
- For large datasets, implement pagination on favorites endpoint

## Code References

**Files Modified:**
- `app/controllers/advancedFeaturesController.js` - API endpoint handlers
- `app/routes/advancedFeaturesRoutes.js` - Route definitions
- `public/js/controllers/photoController.js` - Frontend logic
- `index.pug` - UI template
- `public/main.css` - Styling

**New Files:**
- `sql/favorites.sql` - Database schema
- `scripts/migrate-favorites.js` - Migration script

**Database Table:**
- `mydb.favorites` - Persists favorite data

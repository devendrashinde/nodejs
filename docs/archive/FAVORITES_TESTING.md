# Favorites Feature - Testing Guide

## Quick Test (2 minutes)

### 1. Test Favorite Toggle
1. Open http://localhost:8082 in browser
2. Scroll to any photo
3. Click the heart icon ❤️
   - **Expected:** Heart turns red and shows as filled
4. Click again
   - **Expected:** Heart returns to outline and loses red color

### 2. Test Persistence (Page Refresh)
1. Click heart on 2-3 photos
2. **Refresh the page** (F5 or Ctrl+R)
   - **Expected:** Previously favorited hearts show as red/filled
3. Click a favorited heart to remove
4. Refresh again
   - **Expected:** It no longer shows as red

### 3. Test Database Storage
1. Open browser DevTools (F12)
2. Go to Network tab
3. Click heart on a photo
4. **Expected:** You should see:
   - POST request to `/api/photos/...%2F...%2Fphoto.jpg/favorite`
   - Response: `{"success": true, "isFavorite": true}`

### 4. Test Album Switch
1. Select different albums from sidebar
2. Favorites should load automatically for each album
3. Try favoriting in one album, switch to another, switch back
   - **Expected:** Favorites persisted across albums

## Detailed Testing

### Test: Multiple Photos
1. Favorite 5 different photos from different albums
2. Refresh the page
3. Navigate through all albums
4. **Expected:** All 5 photos should still show red hearts

### Test: API Endpoints

**Test Get All Favorites:**
```javascript
// In browser console:
fetch('/api/favorites')
  .then(r => r.json())
  .then(d => console.log(d))
```
**Expected:** Array of favorite objects with photo_path, album, etc.

**Test Check Favorite:**
```javascript
// Replace PHOTO_PATH with actual path
fetch('/api/favorites/check/data%2Fpictures%2Fsample.jpg')
  .then(r => r.json())
  .then(d => console.log(d))
```
**Expected:** `{success: true, isFavorite: true/false}`

**Test Album Favorites:**
```javascript
fetch('/api/favorites/album/pictures')
  .then(r => r.json())
  .then(d => console.log(d))
```
**Expected:** Array of favorites in that album only

### Test: Data Types
Check that favorite records in database look correct:

```sql
SELECT * FROM favorites LIMIT 5;
```

**Expected Columns:**
| id | user_id | photo_path | photo_name | album | created_at |
|---|---|---|---|---|---|
| 1 | guest | data/pictures/photo.jpg | photo.jpg | pictures | 2024-02-03 10:30:00 |

## Stress Testing

### Test: Many Favorites
1. Favorite 50+ photos across multiple albums
2. Refresh the page
3. Navigate through albums
4. **Performance should remain fast**

### Test: Album Switching
1. Favorite several photos
2. Rapidly click between different albums
3. **Expected:** Favorites load correctly each time, no lag

### Test: Pagination
1. Favorite photos on first page
2. Go to next page
3. Go back to first page
4. **Expected:** First page favorites still red

## Error Scenarios

### Test: Network Error Handling
1. Open DevTools (F12)
2. Go to Network tab
3. Throttle to "Slow 3G"
4. Click heart button
5. **Expected:** Button changes color immediately (optimistic UI)
6. API call eventually completes in background

### Test: Database Down
1. Stop the server: Press Ctrl+C in terminal
2. Try clicking heart button
3. **Expected:** Error message shown, page stays responsive
4. Restart server: `npm run dev`

## Verification Checklist

- [ ] Heart button changes color on click
- [ ] Heart color persists after page refresh
- [ ] Favorites shown in red across different albums
- [ ] API endpoint returns all favorites
- [ ] Check endpoint works for single photos
- [ ] Album filter endpoint returns only album favorites
- [ ] No console errors in DevTools
- [ ] Database table created with `migrate-favorites.js`
- [ ] Toggle favorite multiple times - works each time
- [ ] Fast response time (< 500ms for toggle)

## Browser Console Verification

Paste these commands in browser console (F12) to verify:

```javascript
// Check if favorites API works
console.log('Testing favorites API...');

// Get all favorites
fetch('/api/favorites')
  .then(r => r.json())
  .then(d => console.log('All Favorites:', d))
  .catch(e => console.error('Error:', e));

// Log all photos with isFavorite status
angular.element(document.body).injector().get('$rootScope').$$phase ||
  console.log('Photos with favorites:', 
    angular.element(document.body).injector().get('$rootScope').$scope.photos
      .filter(p => p.isFavorite)
      .map(p => ({name: p.name, path: p.path}))
  );
```

## Known Issues & Workarounds

### Issue: Heart doesn't change color
**Solution:** Hard refresh (Ctrl+Shift+R) to clear cache

### Issue: API returns 404
**Solution:** Check server is running (`npm run dev`)

### Issue: Favorites don't load
**Solution:** 
- Check browser console for errors (F12)
- Verify database migration ran: `node scripts/migrate-favorites.js`
- Check database: `SELECT * FROM favorites;`

## Performance Metrics

Expected response times:
- Toggle favorite: < 500ms
- Load page with 20 photos: < 2 seconds
- Get all favorites API: < 200ms
- Album favorites: < 300ms

## Regression Testing

After any code changes, verify:
1. [ ] Favoriting still works
2. [ ] Page refresh preserves favorites
3. [ ] No console errors
4. [ ] API endpoints respond correctly
5. [ ] Database updates properly
6. [ ] No duplicate favorites in database

## Test Results Log

Date: ___________
Tester: ___________
Browser: ___________

### Results:
- [ ] Pass: All tests passed
- [ ] Fail: Some tests failed (document below)
- [ ] Partial: Partial functionality working

### Notes:
___________________________________________________________

### Failed Tests (if any):
___________________________________________________________

### Performance:
- Heart toggle time: _____ ms
- Page load time: _____ s
- API response time: _____ ms

### Recommendations:
___________________________________________________________

## Cleanup After Testing

1. Optional: Clear test favorites from database
   ```sql
   DELETE FROM favorites; -- Clears all favorites
   ```

2. Review browser storage
   - Check LocalStorage is not caching stale data
   - Clear if needed (DevTools > Application > Clear Storage)

3. Check server logs for errors
   - Review server console output
   - Look for any SQL or API errors

---

**Happy Testing! 🧪**

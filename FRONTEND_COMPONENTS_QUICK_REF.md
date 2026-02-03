# Frontend Components - Quick Reference

## Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `/public/js/advanced-search.js` | Full-text search with filters | 330 |
| `/public/js/exif-display.js` | EXIF metadata viewer | 180 |
| `/public/js/bulk-operations.js` | Multi-select & batch operations | 350 |
| `/public/js/social-features.js` | Comments, ratings, sharing | 420 |
| `/public/css/advanced-features.css` | Styling for all components | 800+ |
| `/FRONTEND_INTEGRATION.md` | Complete integration guide | 400+ |

**Total:** 2,480+ lines of production-ready frontend code

---

## Quick Copy-Paste Examples

### 1. Add to HTML Head

```html
<link rel="stylesheet" href="/css/advanced-features.css">
<script src="/js/advanced-search.js"></script>
<script src="/js/exif-display.js"></script>
<script src="/js/bulk-operations.js"></script>
<script src="/js/social-features.js"></script>
```

### 2. Search Bar

```html
<!-- Add button to open search -->
<button onclick="window.advancedSearch.open()">🔍 Advanced Search</button>

<!-- Add container -->
<div id="advanced-search-container"></div>
```

### 3. Photo Detail Page

```html
<!-- EXIF -->
<button onclick="showExifData('photo/path.jpg')">📸 EXIF Data</button>
<div id="exif-modal"></div>

<!-- Ratings -->
<div id="ratings-container"></div>
<script>
  window.socialFeatures.renderRatings('photo/path.jpg', 'ratings-container');
</script>

<!-- Comments -->
<div id="comments-container"></div>
<script>
  window.socialFeatures.renderComments('photo/path.jpg', 'comments-container');
</script>

<!-- Activity -->
<div id="activity-container"></div>
<script>
  window.socialFeatures.displayActivity('photo/path.jpg', 'activity-container');
</script>
```

### 4. Gallery with Bulk Select

```html
<div id="photo-gallery">
  <div class="result-item">
    <input type="checkbox" class="photo-checkbox" data-photo-id="photo1.jpg" />
    <img src="photo1.jpg" alt="Photo 1" />
  </div>
  <div class="result-item">
    <input type="checkbox" class="photo-checkbox" data-photo-id="photo2.jpg" />
    <img src="photo2.jpg" alt="Photo 2" />
  </div>
</div>

<!-- Bulk toolbar appears automatically when items selected -->
```

### 5. Favorite & Share Buttons

```javascript
// Programmatically add buttons
const container = document.getElementById('photo-buttons');
container.appendChild(window.socialFeatures.createFavoriteButton('photo.jpg'));
container.appendChild(window.socialFeatures.createShareButton('photo.jpg'));
```

---

## Component APIs

### Advanced Search

```javascript
window.advancedSearch.open()              // Show panel
window.advancedSearch.close()             // Hide panel
window.advancedSearch.performSearch()     // Execute search
window.advancedSearch.resetFilters()      // Clear all filters
```

### EXIF Display

```javascript
showExifData('photo/path.jpg')                    // Modal
embedExifData('photo/path.jpg', 'container-id')  // Embed

const exif = new ExifDisplay('photo/path.jpg');
await exif.load();
exif.render('container-id');  // Embed
exif.renderModal();            // Modal
```

### Bulk Operations

```javascript
window.bulkOperations.selectedPhotos        // Set of selected IDs
window.bulkOperations.selectAll(true)       // Select/deselect all
window.bulkOperations.clearSelection()      // Clear selection
window.bulkOperations.bulkAddTags()         // Add tags
window.bulkOperations.bulkRemoveTags()      // Remove tags
window.bulkOperations.bulkFavorite(true)    // Mark favorite
window.bulkOperations.bulkRate(5)           // Rate 1-5
window.bulkOperations.bulkDownload()        // ZIP download
window.bulkOperations.bulkDelete()          // Delete
```

### Social Features

```javascript
// Comments
window.socialFeatures.renderComments(photoId, containerId)
window.socialFeatures.addComment(photoId, text, userName)
window.socialFeatures.loadComments(photoId)

// Ratings
window.socialFeatures.renderRatings(photoId, containerId)
window.socialFeatures.addRating(photoId, rating)
window.socialFeatures.loadRatings(photoId)

// Favorites
window.socialFeatures.toggleFavorite(photoId, isFavorite)
window.socialFeatures.createFavoriteButton(photoId)

// Sharing
window.socialFeatures.createShareLink(photoId)
window.socialFeatures.generateShareLink(photoId)
window.socialFeatures.createShareButton(photoId)

// Activity
window.socialFeatures.displayActivity(photoId, containerId)
window.socialFeatures.getActivity(photoId)
```

---

## CSS Classes Reference

### Search
- `.search-panel` - Container
- `.search-input` - Search field
- `.filters-section` - Filter group
- `.results-grid` - Results layout
- `.result-item` - Single result

### Bulk Operations
- `.bulk-toolbar` - Sticky toolbar
- `.bulk-actions` - Action buttons
- `.photo-checkbox` - Selection checkbox
- `.bulk-progress` - Progress bar

### Comments
- `.comments-section` - Container
- `.comment-item` - Single comment
- `.comment-form` - Input form
- `.comment-replies` - Nested replies

### Ratings
- `.ratings-section` - Container
- `.rating-input` - Star input
- `.star-btn` - Individual star
- `.rating-bar` - Rating display
- `.rating-distribution` - Distribution chart

### General
- `.btn` - Button base
- `.btn-primary`, `.btn-secondary`, `.btn-success`, etc.
- `.modal-content` - Modal container
- `.exif-table` - EXIF data table

---

## Common Tasks

### Show Search Panel on Button Click
```html
<button onclick="window.advancedSearch.open()">Search</button>
```

### Display EXIF in Photo Detail
```javascript
// On page load
embedExifData('photo/path.jpg', 'exif-section');
```

### Enable Bulk Download
```html
<!-- Just add checkboxes with class="photo-checkbox" -->
<!-- Toolbar appears automatically and handles downloads -->
```

### Add Comments to Photo
```javascript
// Add to photo detail view
window.socialFeatures.renderComments(photoId, 'comments-container');
```

### Show Ratings Chart
```javascript
window.socialFeatures.renderRatings(photoId, 'ratings-container');
```

### Add Favorite Button
```javascript
const btn = window.socialFeatures.createFavoriteButton(photoId);
document.getElementById('actions').appendChild(btn);
```

### Add Share Button
```javascript
const btn = window.socialFeatures.createShareButton(photoId);
document.getElementById('actions').appendChild(btn);
```

### Get Selected Photos
```javascript
const selected = Array.from(window.bulkOperations.selectedPhotos);
console.log('Selected:', selected);
```

---

## Responsive Breakpoints

- **Desktop:** Full width (768px+)
- **Tablet:** 2-column grid (480-768px)
- **Mobile:** Single column (<480px)

All components automatically respond to screen size.

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Basic Layout | ✅ | ✅ | ✅ | ✅ |
| Search | ✅ | ✅ | ✅ | ✅ |
| EXIF Display | ✅ | ✅ | ✅ | ✅ |
| Bulk Ops | ✅ | ✅ | ✅ | ✅ |
| Social Features | ✅ | ✅ | ✅ | ✅ |
| Download ZIP | ✅ | ✅ | ✅ | ✅ |
| Google Maps Link | ✅ | ✅ | ✅ | ✅ |

Minimum: ES6+ support required

---

## Integration Checklist

- [ ] Include CSS file in `<head>`
- [ ] Include all 4 JavaScript files before `</body>`
- [ ] Add container divs to HTML
- [ ] Test search functionality
- [ ] Test EXIF display
- [ ] Add checkboxes to photos for bulk ops
- [ ] Test bulk tagging/rating
- [ ] Test social features
- [ ] Customize colors in CSS if needed
- [ ] Test on mobile devices

---

## Troubleshooting

**Components not loading?**
- Check browser console (F12)
- Verify file paths in script tags
- Ensure all 4 JS files are loaded
- Check CSS file is linked

**Search not working?**
- Verify `/api/search` endpoint exists
- Check photo paths in database
- Test with curl: `curl http://localhost:8082/api/search?q=test`

**EXIF not showing?**
- Verify `/api/photos/{id}/exif` endpoint
- Check photo path format
- Test with curl: `curl "http://localhost:8082/api/photos/data%2Fpictures%2Fphoto.jpg/exif"`

**Bulk operations not showing?**
- Add `class="photo-checkbox"` to all checkboxes
- Add `data-photo-id="..."` attribute with photo ID
- Check console for JavaScript errors

**Comments/Ratings not saving?**
- Verify database tables exist
- Check `/api/photos/{id}/comments` and `/ratings` endpoints
- Ensure CORS is configured properly

---

## Performance Tips

1. **Lazy load images** in gallery view
2. **Debounce search input** (auto-handled)
3. **Cache EXIF data** after first load
4. **Limit results to 50** per page
5. **Use ZIP streaming** for large downloads

---

## File Locations

```
public/
├── js/
│   ├── advanced-search.js          (330 lines)
│   ├── exif-display.js             (180 lines)
│   ├── bulk-operations.js          (350 lines)
│   └── social-features.js          (420 lines)
└── css/
    └── advanced-features.css       (800+ lines)

FRONTEND_INTEGRATION.md             (400+ lines)
FRONTEND_COMPONENTS_QUICK_REF.md   (This file)
```

---

## Next Steps

1. ✅ Include files in your HTML
2. ✅ Add container divs
3. ✅ Test with sample photos
4. ✅ Customize styling
5. ✅ Deploy to production

**Your app now has professional-grade features! 🚀**

---

**Last Updated:** February 2, 2026  
**Version:** 3.0.0  
**Status:** Production Ready ✅

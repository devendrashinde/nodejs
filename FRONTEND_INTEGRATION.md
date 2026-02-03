# Frontend Integration Guide - Advanced Features UI

This guide shows how to integrate the new advanced features UI components into your existing photo gallery application.

## Quick Start

### 1. Include the New Resources

Add these to your HTML `<head>` section:

```html
<!-- CSS -->
<link rel="stylesheet" href="/css/advanced-features.css">

<!-- JavaScript Components -->
<script src="/js/advanced-search.js"></script>
<script src="/js/exif-display.js"></script>
<script src="/js/bulk-operations.js"></script>
<script src="/js/social-features.js"></script>
```

### 2. Add Container Elements to Your HTML

Add these containers to your page where you want the features to appear:

```html
<!-- Advanced Search Panel -->
<div id="advanced-search-container"></div>

<!-- Photo Gallery with Bulk Select (add checkboxes to photos) -->
<div id="photo-gallery"></div>

<!-- Social Features in Photo Detail View -->
<div id="photo-comments-container"></div>
<div id="photo-ratings-container"></div>
<div id="photo-activity-container"></div>
```

---

## Component Reference

### 1. Advanced Search

**Initialization:**
```javascript
// Auto-initializes when DOM is ready
// Access via: window.advancedSearch

// To open/close programmatically:
window.advancedSearch.open();
window.advancedSearch.close();
```

**Features:**
- Full-text search with autocomplete
- Multi-field filtering (date, tags, file type, size)
- Tag logic (AND/OR operations)
- Sorting options
- Search statistics

**HTML:**
```html
<div id="advanced-search-container"></div>
```

**Example:**
```javascript
// The component creates its own UI automatically
// Search results are displayed with EXIF and social action buttons
```

---

### 2. EXIF Display

**Quick Display (Modal):**
```javascript
// Show EXIF data in a modal
showExifData('path/to/photo.jpg');
```

**Embed in Container:**
```javascript
// Embed EXIF data in a specific container
embedExifData('path/to/photo.jpg', 'container-id');
```

**Manual Usage:**
```javascript
const exif = new ExifDisplay('path/to/photo.jpg');
exif.load().then(() => {
  exif.render('container-id'); // or exif.renderModal()
});
```

**Features:**
- 50+ metadata fields
- Camera information
- Shooting parameters
- GPS location with Google Maps link
- Copyright and artist info
- Image properties (resolution, color space)
- Date/time information

**HTML:**
```html
<!-- Container for embedded EXIF -->
<div id="photo-exif-container"></div>
```

**Example in Photo Detail:**
```html
<img src="/data/pictures/photo.jpg" alt="Photo" />
<div id="exif-section"></div>

<script>
  embedExifData('data/pictures/photo.jpg', 'exif-section');
</script>
```

---

### 3. Bulk Operations

**Auto-initialization:**
```javascript
// Initializes automatically and manages toolbar visibility
window.bulkOperations
```

**Adding Checkboxes to Photos:**
```html
<div class="photo-item">
  <input 
    type="checkbox" 
    class="photo-checkbox" 
    data-photo-id="path/to/photo.jpg"
  />
  <img src="photo.jpg" alt="Photo" />
</div>
```

**Features:**
- Select/deselect individual or all photos
- Bulk tagging (add/remove)
- Bulk rating (1-5 stars)
- Bulk favorite/unfavorite
- Bulk download as ZIP
- Bulk delete with backup option
- Progress tracking

**Example:**
```html
<div id="photo-gallery">
  <div class="photo-item">
    <input type="checkbox" class="photo-checkbox" data-photo-id="photo1.jpg" />
    <img src="photo1.jpg" />
  </div>
  <div class="photo-item">
    <input type="checkbox" class="photo-checkbox" data-photo-id="photo2.jpg" />
    <img src="photo2.jpg" />
  </div>
</div>
```

---

### 4. Social Features

**Initialize:**
```javascript
// Auto-initializes when DOM is ready
window.socialFeatures
```

#### Comments

**Render Comments Section:**
```javascript
window.socialFeatures.renderComments('photo-id', 'comments-container-id');
```

**Add Comment Programmatically:**
```javascript
window.socialFeatures.addComment('photo-id', 'Great photo!', 'John Doe')
  .then(result => console.log('Comment added'));
```

**HTML:**
```html
<div id="photo-comments-container"></div>

<script>
  window.socialFeatures.renderComments('data/pictures/photo.jpg', 'photo-comments-container');
</script>
```

#### Ratings

**Render Ratings Section:**
```javascript
window.socialFeatures.renderRatings('photo-id', 'ratings-container-id');
```

**HTML:**
```html
<div id="photo-ratings-container"></div>

<script>
  window.socialFeatures.renderRatings('data/pictures/photo.jpg', 'photo-ratings-container');
</script>
```

#### Favorites

**Create Favorite Button:**
```javascript
const favBtn = window.socialFeatures.createFavoriteButton('photo-id');
document.getElementById('button-container').appendChild(favBtn);
```

**Toggle Favorite Programmatically:**
```javascript
window.socialFeatures.toggleFavorite('photo-id', true); // true = favorite
```

#### Sharing

**Create Share Button:**
```javascript
const shareBtn = window.socialFeatures.createShareButton('photo-id');
document.getElementById('button-container').appendChild(shareBtn);
```

**Generate Share Link:**
```javascript
window.socialFeatures.createShareLink('photo-id');
```

#### Activity

**Display Activity Summary:**
```javascript
window.socialFeatures.displayActivity('photo-id', 'activity-container-id');
```

**HTML:**
```html
<div id="photo-activity-container"></div>

<script>
  window.socialFeatures.displayActivity('data/pictures/photo.jpg', 'photo-activity-container');
</script>
```

---

## Complete Photo Detail Page Example

Here's a full example of a photo detail page with all advanced features:

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/css/main.css">
  <link rel="stylesheet" href="/css/advanced-features.css">
</head>
<body>
  <!-- Navigation -->
  <nav>
    <h1>📷 Photo Gallery</h1>
    <button onclick="window.advancedSearch.open()">🔍 Advanced Search</button>
  </nav>

  <!-- Advanced Search Panel (appears on demand) -->
  <div id="advanced-search-container"></div>

  <!-- Main Content -->
  <div class="container">
    <!-- Photo Display -->
    <div class="photo-detail">
      <img 
        id="photo-image" 
        src="/data/pictures/photo.jpg" 
        alt="Photo"
        style="max-width: 100%; border-radius: 8px;"
      />

      <!-- Action Buttons Row -->
      <div class="photo-actions">
        <button 
          class="btn btn-info" 
          onclick="showExifData('data/pictures/photo.jpg')"
        >
          📸 EXIF Data
        </button>
        <div id="favorite-btn-container"></div>
        <div id="share-btn-container"></div>
      </div>

      <!-- EXIF Section -->
      <div id="photo-exif-details"></div>

      <!-- Activity Summary -->
      <div id="photo-activity-details"></div>

      <!-- Ratings -->
      <div id="photo-ratings-section"></div>

      <!-- Comments -->
      <div id="photo-comments-section"></div>
    </div>
  </div>

  <!-- Gallery View with Bulk Operations -->
  <div id="gallery-section" class="gallery-view">
    <h2>📁 Gallery</h2>
    <div id="photo-gallery-grid" class="results-grid">
      <!-- Photos with checkboxes will go here -->
    </div>
  </div>

  <!-- Scripts -->
  <script src="/js/advanced-search.js"></script>
  <script src="/js/exif-display.js"></script>
  <script src="/js/bulk-operations.js"></script>
  <script src="/js/social-features.js"></script>

  <script>
    const photoId = 'data/pictures/photo.jpg';

    // Initialize all sections
    window.addEventListener('DOMContentLoaded', () => {
      // EXIF
      embedExifData(photoId, 'photo-exif-details');

      // Ratings
      window.socialFeatures.renderRatings(photoId, 'photo-ratings-section');

      // Comments
      window.socialFeatures.renderComments(photoId, 'photo-comments-section');

      // Activity
      window.socialFeatures.displayActivity(photoId, 'photo-activity-details');

      // Favorite button
      const favBtn = window.socialFeatures.createFavoriteButton(photoId);
      document.getElementById('favorite-btn-container').appendChild(favBtn);

      // Share button
      const shareBtn = window.socialFeatures.createShareButton(photoId);
      document.getElementById('share-btn-container').appendChild(shareBtn);
    });
  </script>
</body>
</html>
```

---

## Gallery View with Bulk Operations

```html
<div id="photo-gallery">
  <!-- This container will hold photo items with checkboxes -->
</div>

<script>
// Function to render gallery with bulk select
function renderGallery(photos) {
  const gallery = document.getElementById('photo-gallery');
  gallery.innerHTML = '';

  photos.forEach(photo => {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.innerHTML = `
      <input 
        type="checkbox" 
        class="photo-checkbox" 
        data-photo-id="${photo.id}"
      />
      <img 
        src="${photo.thumbnail}" 
        alt="${photo.name}"
        class="result-thumbnail"
      />
      <div class="result-info">
        <h4>${photo.name}</h4>
        <div class="result-actions">
          <button class="btn-small btn-view" onclick="viewPhotoDetail('${photo.id}')">
            View
          </button>
          <button class="btn-small btn-exif" onclick="showExifData('${photo.id}')">
            EXIF
          </button>
        </div>
      </div>
    `;
    gallery.appendChild(item);
  });
}

// Load and render photos
fetch('/get-images')
  .then(r => r.json())
  .then(data => renderGallery(data.photos));
</script>
```

---

## API Integration Notes

### Required Backend Endpoints

All components expect these API endpoints to exist:

**Search:**
- `GET /api/search` - Advanced search with filters
- `GET /api/search/suggestions` - Autocomplete suggestions

**EXIF:**
- `GET /api/photos/{id}/exif` - Get EXIF data

**Bulk Operations:**
- `POST /api/bulk/tags` - Add tags
- `POST /api/bulk/tags/remove` - Remove tags
- `POST /api/bulk/favorite` - Mark favorite
- `POST /api/bulk/rate` - Rate photos
- `POST /api/bulk/download` - Download ZIP
- `POST /api/bulk/delete` - Delete photos

**Social Features:**
- `GET /api/photos/{id}/comments` - Get comments
- `POST /api/photos/{id}/comments` - Add comment
- `GET /api/photos/{id}/ratings` - Get ratings
- `POST /api/photos/{id}/ratings` - Add rating
- `POST /api/photos/{id}/favorite` - Toggle favorite
- `POST /api/photos/{id}/share` - Generate share link
- `GET /api/photos/{id}/activity` - Get activity summary

All of these are **already implemented** in your v3.0 backend!

---

## Customization

### Styling

Edit `/public/css/advanced-features.css` to customize:
- Colors and gradients
- Button styles
- Component layout
- Responsive breakpoints

### Component Options

Each component can be customized:

```javascript
// Advanced Search - custom container
new AdvancedSearch('your-container-id');

// EXIF - custom rendering
const exif = new ExifDisplay(photoId);
const html = exif.render('your-container-id');

// Bulk Operations - custom selection
window.bulkOperations.selectedPhotos // Set<photoId>

// Social Features - custom user ID
window.socialFeatures.getUserId() // Override this method
```

---

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript required
- Fetch API required
- CSS Grid and Flexbox support required

---

## Troubleshooting

**EXIF modal not appearing:**
- Ensure photo path is correct
- Check browser console for fetch errors
- Verify `/api/photos/{id}/exif` endpoint is accessible

**Bulk toolbar not showing:**
- Add `class="photo-checkbox"` to checkboxes
- Add `data-photo-id="..."` attribute with photo ID
- Check console for JavaScript errors

**Comments not loading:**
- Verify database tables exist (see ADVANCED_FEATURES.md)
- Check `/api/photos/{id}/comments` endpoint
- Ensure proper CORS headers if cross-origin

**Search not working:**
- Verify `/api/search` endpoint is accessible
- Check photo file paths
- Ensure database has photo records

---

## Performance Tips

1. **Lazy Load Images:** Use image lazy loading for gallery performance
2. **Debounce Search:** Search input is debounced automatically
3. **Cache Results:** Store search results in sessionStorage
4. **Limit EXIF Loading:** Load EXIF only when requested (modal/detail view)
5. **Batch Operations:** Bulk operations are optimized for up to 1000 photos

---

## Next Steps

1. ✅ Include CSS and JavaScript files
2. ✅ Add container elements to your HTML
3. ✅ Test with curl examples from QUICK_START_ADVANCED.md
4. ✅ Customize styling as needed
5. ✅ Set up database tables for social features (optional)
6. ✅ Test with real photo sets

Your application is **production-ready** with full advanced features! 🚀

# Integration Guide: Adding Advanced Features to index.pug

## Overview

Your application uses **AngularJS** for the SPA framework. The new advanced features are built with **vanilla JavaScript** and work alongside AngularJS without conflicts.

## Integration Strategy

You have two options:

### Option 1: Side-by-Side (Recommended)
- Keep existing AngularJS gallery working as-is
- Add new features as enhancement layers
- Both systems work together

### Option 2: Full Replacement
- Replace AngularJS gallery with new components
- More work but cleaner architecture

**We'll use Option 1** - it's safer and allows gradual adoption.

---

## Step-by-Step Integration

### 1. Add CSS to Head Section

In `index.pug`, add the new stylesheet after your existing ones:

```pug
doctype html
html(ng-app="app")
  head
    meta(charset="utf-8")
    meta(name="viewport" content="width=device-width, initial-scale=1")
    title= title
    link(rel="stylesheet", href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css")
    link(rel="stylesheet", href="gallery.css")
    link(rel="stylesheet", href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css")
    link(rel="stylesheet", href="jquery.fancybox.min.css")
    link(rel="stylesheet", href="main.css")
    
    //- ADD THIS LINE:
    link(rel="stylesheet", href="css/advanced-features.css")
```

### 2. Add JavaScript Files at Bottom

Before the closing `</body>`, add the new scripts **after** your AngularJS scripts:

```pug
    // Existing Angular scripts
    script(src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.6.1/angular.min.js")
    script(src="https://cdnjs.cloudflare.com/ajax/libs/angular-ui-router/0.2.18/angular-ui-router.min.js")
    script(src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js")
    script(src="jquery/jquery.min.js")
    script(src="jquery.fancybox.min.js")
    script(src="js/ng-app.js")    
    script(src="main.js")
    script(src="js/controllers/photoController.js")
    script(src="js/directives/modalDirective.js")
    script(src="js/directives/fileModelDirective.js")
    script(src="js/directives/shrinkHeaderDirective.js")
    script(src="js/services/photoService.js")
    script(src="js/services/modalService.js")
    
    //- ADD THESE LINES:
    script(src="js/advanced-search.js")
    script(src="js/exif-display.js")
    script(src="js/bulk-operations.js")
    script(src="js/social-features.js")
```

### 3. Add Advanced Search Button to Header

Replace or add to your existing search button in the header:

```pug
// Search button - REPLACE THIS:
button.btn.btn-outline-primary(
  type="button" 
  data-bs-toggle="modal" 
  data-bs-target="#searchModal"
)
  i.fas.fa-search

// WITH THIS (dual search - basic + advanced):
div.btn-group
  button.btn.btn-outline-primary(
    type="button" 
    data-bs-toggle="modal" 
    data-bs-target="#searchModal"
    title="Quick search"
  )
    i.fas.fa-search
  
  button.btn.btn-outline-info(
    type="button"
    onclick="window.advancedSearch.open()"
    title="Advanced search"
  )
    i.fas.fa-search-plus
```

### 4. Add Advanced Search Container

Add this container **after** the header section, before the sidebar:

```pug
      // Header section ends here...

      //- ADD THIS SECTION:
      //- Advanced Search Panel (appears when opened)
      div#advanced-search-container

      // Sidebar + Content section starts here...
      div.row
```

### 5. Add Checkboxes to Gallery Items for Bulk Operations

Modify your photo card to include a checkbox:

```pug
div.col-sm-6.col-md-4.col-lg-3(ng-repeat="image in photos")
  div.card.shadow-sm(style="position: relative;")
    
    //- ADD THIS CHECKBOX:
    input.photo-checkbox(
      type="checkbox"
      ng-attr-data-photo-id="{{image.path}}"
      style="position: absolute; top: 10px; left: 10px; z-index: 5; width: 20px; height: 20px; cursor: pointer;"
    )
    
    a(
      ng-if="!image.isAudio"
      ng-href="{{image.path}}"
      data-fancybox="gallery"
      data-caption="{{image.tags}}"
      ng-attr-data-type="{{image.isAudio ? 'iframe' : (image.isVideo ? 'video' : (image.isPdf ? 'iframe' : 'image'))}}"
      ng-attr-data-width="{{image.isVideo ? '640' : undefined}}"
      ng-attr-data-height="{{image.isVideo ? '360' : undefined}}"
    )
      figure
        img.card-img-top.img-fluid(
          ng-src="{{image.isAudio ? 'music.png' : (image.isVideo ? '/thumbs?id=' + image.path + '&w=300&h=200' : (image.isPdf ? 'pdf.png' : '/thumbs?id=' + image.path + '&w=300&h=200'))}}"
          alt="{{image.tags}}"
          loading="lazy"
          style="object-fit: contain; width: 100%; height: auto;"
        )
        i.overlay-icon(
          ng-class="{'fas fa-play-circle': image.isAudio || image.isVideo,'fas fa-file-pdf': image.isPdf,'fas fa-search-plus': image.isPhoto}"
        )
    
    div.card-body.p-2
      h6.card-title.mb-1.text-truncate
        a.text-decoration-none.text-dark(
          href="javascript:void(0)"
          ng-click="editImageTag(image)"
          title="Edit tags"
        ) {{image.tags || 'Untitled'}}
      
      //- ADD THESE ACTION BUTTONS:
      div.d-flex.gap-1.mt-2
        button.btn.btn-sm.btn-outline-info(
          type="button"
          ng-click="showExifModal(image)"
          title="View EXIF"
        )
          i.fas.fa-camera
        
        button.btn.btn-sm.btn-outline-danger(
          type="button"
          ng-click="toggleFavorite(image)"
          ng-class="{'active': image.isFavorite}"
          title="Favorite"
        )
          i.fas.fa-heart
        
        button.btn.btn-sm.btn-outline-success(
          type="button"
          ng-click="sharePhoto(image)"
          title="Share"
        )
          i.fas.fa-share-alt
```

### 6. Add EXIF Modal to Display Photo Details

Add this modal after your existing modals (after `#uploadModal`):

```pug
      //- EXIF Details Modal (ADD THIS)
      div.modal.fade#exifModal(tabindex="-1" aria-labelledby="exifModalLabel" aria-hidden="true")
        div.modal-dialog.modal-dialog-centered.modal-lg
          div.modal-content
            div.modal-header
              h5.modal-title#exifModalLabel 📸 Photo Details
              button.btn-close(type="button" data-bs-dismiss="modal" aria-label="Close")
            div.modal-body#exif-modal-body
              p.text-center.text-muted Loading EXIF data...
            div.modal-footer
              button.btn.btn-secondary(type="button" data-bs-dismiss="modal") Close
```

### 7. Add Helper Functions to photoController.js

Add these functions to your AngularJS controller (`public/js/controllers/photoController.js`):

```javascript
// ADD THESE FUNCTIONS TO YOUR photoController:

// Show EXIF modal
$scope.showExifModal = function(image) {
  // Use vanilla JS to show EXIF
  const modal = new bootstrap.Modal(document.getElementById('exifModal'));
  modal.show();
  
  // Load EXIF data
  const exif = new ExifDisplay(image.path);
  exif.load().then(() => {
    exif.render('exif-modal-body');
  }).catch(() => {
    document.getElementById('exif-modal-body').innerHTML = 
      '<p class="text-danger">No EXIF data available for this photo.</p>';
  });
};

// Toggle favorite
$scope.toggleFavorite = function(image) {
  const isFavorite = !image.isFavorite;
  window.socialFeatures.toggleFavorite(image.path, isFavorite)
    .then(() => {
      image.isFavorite = isFavorite;
      $scope.$apply();
    });
};

// Share photo
$scope.sharePhoto = function(image) {
  window.socialFeatures.createShareLink(image.path);
};
```

---

## Complete Modified index.pug

Here's what the key sections should look like after integration:

```pug
doctype html
html(ng-app="app")
  head
    meta(charset="utf-8")
    meta(name="viewport" content="width=device-width, initial-scale=1")
    title= title
    link(rel="stylesheet", href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css")
    link(rel="stylesheet", href="gallery.css")
    link(rel="stylesheet", href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css")
    link(rel="stylesheet", href="jquery.fancybox.min.css")
    link(rel="stylesheet", href="main.css")
    link(rel="stylesheet", href="css/advanced-features.css")
  
  body#top
    div(class="container-fluid py-3" id="controller" ng-controller="photoController")
      // ... existing loading spinner ...
      
      // Header with Advanced Search button
      header.collapsible-header.d-flex.flex-column.sticky-top.bg-white.border-bottom.shadow-sm.px-2.py-2(combo-header)
        div.d-flex.align-items-center.flex-nowrap.w-100
          img(src="/favicon.png" alt="Home" width="28" class="me-2")
          h6.mb-0.flex-grow-1.text-truncate {{selectedAlbum.name}}
          div.d-flex.align-items-center.ms-auto.gap-2.flex-nowrap
            
            // Dual Search: Basic + Advanced
            div.btn-group
              button.btn.btn-outline-primary.btn-sm(
                type="button" 
                data-bs-toggle="modal" 
                data-bs-target="#searchModal"
                title="Quick search"
              )
                i.fas.fa-search
              
              button.btn.btn-outline-info.btn-sm(
                type="button"
                onclick="window.advancedSearch.open()"
                title="Advanced search"
              )
                i.fas.fa-search-plus
            
            // ... rest of header buttons ...
        
        // ... rest of header sections ...
      
      //- Advanced Search Panel
      div#advanced-search-container
      
      // ... rest of content ...
      
      //- All existing modals (editTagModal, searchModal, uploadModal)
      //- ...
      
      //- EXIF Modal (NEW)
      div.modal.fade#exifModal(tabindex="-1" aria-labelledby="exifModalLabel" aria-hidden="true")
        div.modal-dialog.modal-dialog-centered.modal-lg
          div.modal-content
            div.modal-header
              h5.modal-title#exifModalLabel 📸 Photo Details
              button.btn-close(type="button" data-bs-dismiss="modal" aria-label="Close")
            div.modal-body#exif-modal-body
              p.text-center.text-muted Loading EXIF data...
            div.modal-footer
              button.btn.btn-secondary(type="button" data-bs-dismiss="modal") Close
    
    // Scripts
    script(src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.6.1/angular.min.js")
    script(src="https://cdnjs.cloudflare.com/ajax/libs/angular-ui-router/0.2.18/angular-ui-router.min.js")
    script(src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js")
    script(src="jquery/jquery.min.js")
    script(src="jquery.fancybox.min.js")
    script(src="js/ng-app.js")    
    script(src="main.js")
    script(src="js/controllers/photoController.js")
    script(src="js/directives/modalDirective.js")
    script(src="js/directives/fileModelDirective.js")
    script(src="js/directives/shrinkHeaderDirective.js")
    script(src="js/services/photoService.js")
    script(src="js/services/modalService.js")
    
    //- New Advanced Features
    script(src="js/advanced-search.js")
    script(src="js/exif-display.js")
    script(src="js/bulk-operations.js")
    script(src="js/social-features.js")
```

---

## Features You Can Use Now

### 1. Advanced Search
- Click "Advanced Search" button → Opens filter panel
- Full-text search with autocomplete
- Filter by date, tags, file type, size
- Results show in the panel

### 2. EXIF Display
- Click camera icon on photo card → Shows EXIF modal
- 50+ metadata fields
- GPS location with Google Maps link

### 3. Bulk Operations
- Check multiple photo checkboxes → Toolbar appears
- Bulk tag, rate, favorite, download as ZIP

### 4. Social Features
- Heart icon → Toggle favorite
- Share icon → Generate share link
- (Comments/ratings can be added to photo detail view)

---

## Optional: Add Photo Detail Page

Create a separate detail view page with all social features. Add to your routes:

```pug
//- Add to index.pug or create separate detail.pug
div.modal.fade#photoDetailModal(tabindex="-1" aria-labelledby="photoDetailLabel" aria-hidden="true")
  div.modal-dialog.modal-xl
    div.modal-content
      div.modal-header
        h5.modal-title#photoDetailLabel Photo Detail
        button.btn-close(type="button" data-bs-dismiss="modal" aria-label="Close")
      div.modal-body
        div.row
          div.col-md-8
            img#detail-photo.img-fluid(src="" alt="Photo")
          div.col-md-4
            //- Ratings
            div#detail-ratings
            
            //- Activity
            div#detail-activity
            
            //- EXIF Summary
            div#detail-exif-summary
        
        div.row.mt-3
          div.col-12
            //- Comments
            div#detail-comments
```

Then in your controller:

```javascript
$scope.viewPhotoDetail = function(image) {
  const modal = new bootstrap.Modal(document.getElementById('photoDetailModal'));
  document.getElementById('detail-photo').src = image.path;
  modal.show();
  
  // Load social features
  window.socialFeatures.renderRatings(image.path, 'detail-ratings');
  window.socialFeatures.renderComments(image.path, 'detail-comments');
  window.socialFeatures.displayActivity(image.path, 'detail-activity');
  embedExifData(image.path, 'detail-exif-summary');
};
```

---

## Testing Checklist

After integration:

- [ ] Advanced search button appears in header
- [ ] Click advanced search → Panel opens
- [ ] Search works and returns results
- [ ] Photo checkboxes appear on cards
- [ ] Select photos → Bulk toolbar appears
- [ ] Camera icon shows EXIF modal
- [ ] Heart icon toggles favorite
- [ ] Share icon generates link
- [ ] No JavaScript console errors
- [ ] Mobile layout still works

---

## Troubleshooting

**Advanced search doesn't open:**
- Check browser console for errors
- Verify `advanced-search.js` loaded
- Check `window.advancedSearch` exists in console

**EXIF modal shows "Loading..." forever:**
- Verify `/api/photos/{id}/exif` endpoint exists
- Check photo path encoding
- Test endpoint with curl

**Bulk toolbar doesn't appear:**
- Verify checkboxes have `class="photo-checkbox"`
- Verify checkboxes have `data-photo-id` attribute
- Check `window.bulkOperations` exists

**AngularJS conflicts:**
- The new components use vanilla JS and won't conflict
- Use `$scope.$apply()` when updating Angular scope from vanilla JS

---

## Next Steps

1. **Start simple:** Add just the CSS and JS files
2. **Test:** Verify no errors in console
3. **Add search button:** Add advanced search button to header
4. **Add checkboxes:** Enable bulk operations
5. **Add EXIF:** Add camera icon to cards
6. **Expand:** Add more features as needed

Your AngularJS app and new features will work together seamlessly! 🚀

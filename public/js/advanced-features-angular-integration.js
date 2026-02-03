/**
 * Advanced Features Integration for AngularJS photoController
 * 
 * Add these functions to your existing photoController.js
 * Or include this file after photoController.js loads
 */

// Wait for Angular app to be ready
angular.element(document).ready(function() {
  // Get the controller scope
  const controllerElement = document.getElementById('controller');
  if (!controllerElement) return;
  
  const scope = angular.element(controllerElement).scope();
  if (!scope) return;

  // Apply the new methods to the scope
  scope.$apply(function() {
    
    /**
     * Show EXIF modal for a photo
     */
    scope.showExifModal = function(image) {
      if (!image || !image.path) return;
      
      // Get or create Bootstrap modal instance
      const modalEl = document.getElementById('exifModal');
      const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      
      // Reset modal content
      document.getElementById('exif-modal-body').innerHTML = 
        '<p class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Loading EXIF data...</p>';
      
      // Show modal
      modal.show();
      
      // Load EXIF data using the advanced features component
      if (window.ExifDisplay) {
        const exif = new ExifDisplay(image.path);
        exif.load()
          .then(() => {
            exif.render('exif-modal-body');
          })
          .catch((error) => {
            console.error('EXIF load error:', error);
            document.getElementById('exif-modal-body').innerHTML = 
              '<div class="alert alert-info">' +
              '<i class="fas fa-info-circle"></i> No EXIF data available for this photo.' +
              '</div>';
          });
      } else {
        document.getElementById('exif-modal-body').innerHTML = 
          '<div class="alert alert-warning">' +
          '<i class="fas fa-exclamation-triangle"></i> EXIF viewer not loaded. Please refresh the page.' +
          '</div>';
      }
    };

    /**
     * Toggle favorite status for a photo
     */
    scope.toggleFavorite = function(image) {
      if (!image || !image.path) return;
      
      const isFavorite = !image.isFavorite;
      
      if (window.socialFeatures) {
        window.socialFeatures.toggleFavorite(image.path, isFavorite)
          .then((result) => {
            // Update the image object
            image.isFavorite = isFavorite;
            
            // Force Angular to update
            scope.$apply();
            
            // Optional: Show toast notification
            console.log(isFavorite ? '❤️ Added to favorites' : '🤍 Removed from favorites');
          })
          .catch((error) => {
            console.error('Favorite toggle error:', error);
            alert('Failed to update favorite status');
          });
      } else {
        console.warn('Social features not loaded');
      }
    };

    /**
     * Generate and show share link for a photo
     */
    scope.sharePhoto = function(image) {
      if (!image || !image.path) return;
      
      if (window.socialFeatures) {
        window.socialFeatures.createShareLink(image.path)
          .catch((error) => {
            console.error('Share link error:', error);
            alert('Failed to create share link');
          });
      } else {
        console.warn('Social features not loaded');
      }
    };

    /**
     * Rate a photo (1-5 stars)
     */
    scope.ratePhoto = function(image, rating) {
      if (!image || !image.path || !rating) return;
      
      if (window.socialFeatures) {
        window.socialFeatures.addRating(image.path, rating)
          .then(() => {
            image.rating = rating;
            scope.$apply();
            console.log(`Rated ${rating} stars`);
          })
          .catch((error) => {
            console.error('Rating error:', error);
            alert('Failed to save rating');
          });
      } else {
        console.warn('Social features not loaded');
      }
    };

    /**
     * Add comment to a photo
     */
    scope.addPhotoComment = function(image, commentText, userName) {
      if (!image || !image.path || !commentText) return;
      
      if (window.socialFeatures) {
        window.socialFeatures.addComment(image.path, commentText, userName || 'Anonymous')
          .then(() => {
            console.log('Comment added');
            // Optionally reload comments
          })
          .catch((error) => {
            console.error('Comment error:', error);
            alert('Failed to add comment');
          });
      } else {
        console.warn('Social features not loaded');
      }
    };

    /**
     * Open advanced search panel
     */
    scope.openAdvancedSearch = function() {
      if (window.advancedSearch) {
        window.advancedSearch.open();
      } else {
        console.warn('Advanced search not loaded');
      }
    };

    /**
     * Get selected photos from bulk operations
     */
    scope.getSelectedPhotos = function() {
      if (window.bulkOperations) {
        return Array.from(window.bulkOperations.selectedPhotos);
      }
      return [];
    };

    /**
     * Clear bulk selection
     */
    scope.clearBulkSelection = function() {
      if (window.bulkOperations) {
        window.bulkOperations.clearSelection();
      }
    };

    console.log('✓ Advanced features integrated with AngularJS controller');
  });
});

// Alternative: If you want to add these directly to your photoController.js,
// copy the function bodies above into your controller definition like this:

/*
app.controller('photoController', function($scope, $http, photoService, modalService) {
  // ... your existing controller code ...

  // Add these new functions:
  $scope.showExifModal = function(image) { ... };
  $scope.toggleFavorite = function(image) { ... };
  $scope.sharePhoto = function(image) { ... };
  // etc.
});
*/

var activeFilter = 'all';

// Detect mobile device
var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Track rotation state for each slide
var rotationAngles = {};

// Initialize Fancybox on gallery links with all enhancements
function initFancybox() {
  if (typeof $.fancybox === 'undefined') return;
  
  // Bind Fancybox to gallery links
  $('[data-fancybox="gallery"]').fancybox({
    loop: true,
    autoSize: true,
    protect: true,
    keyboard: {
      ESCAPE: 'close',
      DELETE: 'close',
      BACKSPACE: 'close',
      LEFT: 'prev',
      RIGHT: 'next',
      UP: 'prev',
      DOWN: 'next',
      SPACE: 'toggleControls',
      F: 'toggleFullscreen',
      Z: 'toggleZoom',
      H: 'toggleKeyboardHelp',
      I: 'toggleInfo',
      T: 'toggleThumbs'
    },
    buttons: [
      'rotateLeft',
      'rotateRight',
      'download',
      'favorite',
      'playlist',
      'info',
      'zoom',
      'slideShow',
      'thumbs',
      'fullscreen',
      'keyboard',
      'close'
    ],
    // Custom button templates
    btnTpl: {
      rotateLeft:
        '<button data-fancybox-rotate-left class="fancybox-button fancybox-button--rotate-left" title="Rotate Left (Counter-clockwise)">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z"/></svg>' +
        '</button>',
      rotateRight:
        '<button data-fancybox-rotate-right class="fancybox-button fancybox-button--rotate-right" title="Rotate Right (Clockwise)">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z"/></svg>' +
        '</button>',
      download:
        '<button data-fancybox-download class="fancybox-button fancybox-button--download" title="Download">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>' +
        '</button>',
      favorite:
        '<button data-fancybox-favorite class="fancybox-button fancybox-button--favorite" title="Add to Favorites">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' +
        '</button>',
      playlist:
        '<button data-fancybox-playlist class="fancybox-button fancybox-button--playlist" title="Add to Playlist">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>' +
        '</button>',
      info:
        '<button data-fancybox-info class="fancybox-button fancybox-button--info" title="Show Info (I)">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>' +
        '</button>',
      fullscreen:
        '<button data-fancybox-fullscreen class="fancybox-button fancybox-button--fullscreen" title="Fullscreen (F)">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>' +
        '</button>',
      keyboard:
        '<button data-fancybox-keyboard class="fancybox-button fancybox-button--keyboard" title="Keyboard Shortcuts (H)">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/></svg>' +
        '</button>',
      thumbs:
        '<button data-fancybox-thumbs class="fancybox-button fancybox-button--thumbs" title="Toggle Thumbnails (T)">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z"/></svg>' +
        '</button>'
    },
    beforeShow: function(instance, current) {
      // Clean up video controls from previous slide
      $('.fancybox-video-controls').remove();
      
      // Reset toolbar visibility for new slide
      instance.$refs.container.removeClass('fancybox-hide-toolbar');
      
      // Reset rotation for this slide if not set
      if (!rotationAngles[current.index]) {
        rotationAngles[current.index] = 0;
      }
      
      // Add navigation counter
      var total = instance.group.length;
      var currentNum = current.index + 1;
      
      $('.fancybox-counter').remove();
      instance.$refs.toolbar.prepend(
        '<div class="fancybox-counter">' + currentNum + ' / ' + total + '</div>'
      );
      
      // Apply stored rotation
      setTimeout(function() {
        var $content = current.$content;
        if ($content) {
          $content.find('img').css({
            'transform': 'rotate(' + rotationAngles[current.index] + 'deg)',
            'transition': 'transform 0.3s ease'
          });
        }
      }, 50);
      
      // Add video controls if it's a video
      if (current.type === 'video' || current.type === 'html') {
        setTimeout(function() {
          addVideoControls(instance, current);
        }, 500);
      }
    },
    afterShow: function(instance, current) {
      var $container = instance.$refs.container;
      var scope = angular.element(document.querySelector('#controller')).scope();
      
      // Auto-hide toolbar after 2 seconds of inactivity
      var hideToolbarTimeout;
      var showToolbar = function() {
        $container.removeClass('fancybox-hide-toolbar');
        clearTimeout(hideToolbarTimeout);
        hideToolbarTimeout = setTimeout(function() {
          $container.addClass('fancybox-hide-toolbar');
        }, 2000);
      };
      
      // Show toolbar on mouse movement
      $container.on('mousemove.fancybox-autohide', showToolbar);
      
      // Initial hide after 2 seconds
      showToolbar();
      
      // Rotate Left button handler
      $container.off('click', '[data-fancybox-rotate-left]').on('click', '[data-fancybox-rotate-left]', function(e) {
        e.preventDefault();
        var angle = rotationAngles[current.index] || 0;
        angle -= 90;
        rotationAngles[current.index] = angle;
        
        current.$content.find('img').css({
          'transform': 'rotate(' + angle + 'deg)',
          'transition': 'transform 0.3s ease'
        });
      });
      
      // Rotate Right button handler
      $container.off('click', '[data-fancybox-rotate-right]').on('click', '[data-fancybox-rotate-right]', function(e) {
        e.preventDefault();
        var angle = rotationAngles[current.index] || 0;
        angle += 90;
        rotationAngles[current.index] = angle;
        
        current.$content.find('img').css({
          'transform': 'rotate(' + angle + 'deg)',
          'transition': 'transform 0.3s ease'
        });
      });
      
      // Download button handler
      $container.off('click', '[data-fancybox-download]').on('click', '[data-fancybox-download]', function(e) {
        e.preventDefault();
        var url = current.src;
        var filename = url.substring(url.lastIndexOf('/') + 1);
        
        var link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
      
      // Favorite button handler
      $container.off('click', '[data-fancybox-favorite]').on('click', '[data-fancybox-favorite]', function(e) {
        e.preventDefault();
        if (scope) {
          var photoPath = current.src;
          // Find the photo in the scope
          var photo = scope.photos.find(function(p) { return p.path === photoPath; });
          if (photo) {
            scope.$apply(function() {
              scope.toggleFavorite(photo);
            });
            $(this).toggleClass('is-favorite');
          }
        }
      });
      
      // Playlist button handler
      $container.off('click', '[data-fancybox-playlist]').on('click', '[data-fancybox-playlist]', function(e) {
        e.preventDefault();
        if (scope) {
          var photoPath = current.src;
          var photo = scope.photos.find(function(p) { return p.path === photoPath; });
          if (photo) {
            scope.$apply(function() {
              scope.openAddToPlaylistModal(photo);
            });
          }
        }
      });
      
      // Info button handler
      $container.off('click', '[data-fancybox-info]').on('click', '[data-fancybox-info]', function(e) {
        e.preventDefault();
        toggleInfoPanel(instance, current);
      });
      
      // Fullscreen button handler
      $container.off('click', '[data-fancybox-fullscreen]').on('click', '[data-fancybox-fullscreen]', function(e) {
        e.preventDefault();
        toggleFullscreen(instance.$refs.container[0]);
      });
      
      // Keyboard shortcuts button handler
      $container.off('click', '[data-fancybox-keyboard]').on('click', '[data-fancybox-keyboard]', function(e) {
        e.preventDefault();
        showKeyboardHelp();
      });
      
      // Thumbs button handler
      $container.off('click', '[data-fancybox-thumbs]').on('click', '[data-fancybox-thumbs]', function(e) {
        e.preventDefault();
        toggleThumbnails(instance);
      });
      
      // Check if photo is favorited and update button
      if (scope) {
        var photoPath = current.src;
        var photo = scope.photos.find(function(p) { return p.path === photoPath; });
        if (photo && photo.isFavorite) {
          $container.find('[data-fancybox-favorite]').addClass('is-favorite');
        }
      }
    },
    beforeClose: function(instance, current) {
      // Clean up info panel and thumbnails
      $('.fancybox-info-panel').remove();
      $('.fancybox-thumbs-strip').remove();
      $('.fancybox-keyboard-help').remove();
      $('.fancybox-video-controls').remove();
      
      // Clean up auto-hide toolbar event listener
      instance.$refs.container.off('mousemove.fancybox-autohide');
    }
  });
}

// Toggle info panel with image details
function toggleInfoPanel(instance, current) {
  var $panel = $('.fancybox-info-panel');
  
  if ($panel.length) {
    $panel.slideToggle(200);
    return;
  }
  
  // Create info panel
  var url = current.src;
  var filename = url.substring(url.lastIndexOf('/') + 1);
  var caption = current.opts.caption || '';
  
  var infoHtml = '<div class="fancybox-info-panel">' +
    '<div class="info-header">' +
    '<i class="fas fa-info-circle"></i> Image Information' +
    '<button class="info-close">&times;</button>' +
    '</div>' +
    '<div class="info-content">' +
    '<div class="info-row"><span class="info-label">Filename:</span> <span class="info-value">' + filename + '</span></div>';
  
  if (caption) {
    infoHtml += '<div class="info-row"><span class="info-label">Tags:</span> <span class="info-value info-tags">' + formatTags(caption) + '</span></div>';
  }
  
  // Try to get image dimensions
  var $img = current.$content.find('img');
  if ($img.length) {
    var img = $img[0];
    if (img.naturalWidth) {
      infoHtml += '<div class="info-row"><span class="info-label">Dimensions:</span> <span class="info-value">' + img.naturalWidth + ' × ' + img.naturalHeight + ' px</span></div>';
    }
  }
  
  infoHtml += '<div class="info-row"><span class="info-label">Position:</span> <span class="info-value">' + (current.index + 1) + ' of ' + instance.group.length + '</span></div>';
  infoHtml += '</div></div>';
  
  instance.$refs.container.append(infoHtml);
  
  // Close button handler
  $('.info-close').on('click', function() {
    $('.fancybox-info-panel').slideUp(200);
  });
}

// Format tags as badges
function formatTags(tags) {
  if (!tags) return '';
  var tagArray = tags.split(',');
  var html = '';
  tagArray.forEach(function(tag) {
    tag = tag.trim();
    if (tag) {
      html += '<span class="tag-badge">' + tag + '</span> ';
    }
  });
  return html || tags;
}

// Toggle fullscreen mode
function toggleFullscreen(element) {
  if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement) {
    // Enter fullscreen
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  } else {
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

// Show keyboard shortcuts help
function showKeyboardHelp() {
  var $help = $('.fancybox-keyboard-help');
  
  if ($help.length) {
    $help.fadeToggle(200);
    return;
  }
  
  var helpHtml = '<div class="fancybox-keyboard-help">' +
    '<div class="keyboard-help-content">' +
    '<h4><i class="fas fa-keyboard"></i> Keyboard Shortcuts</h4>' +
    '<button class="keyboard-help-close">&times;</button>' +
    '<div class="shortcuts-grid">' +
    '<div class="shortcut"><kbd>←</kbd><kbd>→</kbd><span>Next/Previous</span></div>' +
    '<div class="shortcut"><kbd>ESC</kbd><span>Close</span></div>' +
    '<div class="shortcut"><kbd>F</kbd><span>Fullscreen</span></div>' +
    '<div class="shortcut"><kbd>Z</kbd><span>Toggle Zoom</span></div>' +
    '<div class="shortcut"><kbd>I</kbd><span>Toggle Info</span></div>' +
    '<div class="shortcut"><kbd>T</kbd><span>Toggle Thumbnails</span></div>' +
    '<div class="shortcut"><kbd>H</kbd><span>This Help</span></div>' +
    '<div class="shortcut"><kbd>SPACE</kbd><span>Toggle Controls</span></div>' +
    '</div>' +
    '</div>' +
    '</div>';
  
  $('.fancybox-container').append(helpHtml);
  
  $('.keyboard-help-close').on('click', function() {
    $('.fancybox-keyboard-help').fadeOut(200);
  });
  
  // Close on click outside
  $('.fancybox-keyboard-help').on('click', function(e) {
    if ($(e.target).hasClass('fancybox-keyboard-help')) {
      $(this).fadeOut(200);
    }
  });
}

// Toggle thumbnail strip
function toggleThumbnails(instance) {
  var $thumbs = $('.fancybox-thumbs-strip');
  
  if ($thumbs.length) {
    $thumbs.slideToggle(200);
    return;
  }
  
  var thumbsHtml = '<div class="fancybox-thumbs-strip">';
  
  instance.group.forEach(function(item, index) {
    var isActive = index === instance.currIndex ? ' active' : '';
    var thumbSrc = item.thumb || item.src;
    thumbsHtml += '<div class="fancybox-thumb' + isActive + '" data-index="' + index + '">' +
      '<img src="' + thumbSrc + '" alt="">' +
      '</div>';
  });
  
  thumbsHtml += '</div>';
  
  instance.$refs.container.append(thumbsHtml);
  
  // Click handler for thumbnails
  $('.fancybox-thumb').on('click', function() {
    var index = $(this).data('index');
    instance.jumpTo(index);
    $('.fancybox-thumb').removeClass('active');
    $(this).addClass('active');
  });
}

// Add video controls (playback speed, volume, etc.)
function addVideoControls(instance, current) {
  // Only add controls for video content
  if (current.type !== 'video' && current.type !== 'html') return;
  
  var $video = current.$content.find('video');
  if (!$video.length) return;
  
  var video = $video[0];
  
  // Remove any existing controls first
  $('.fancybox-video-controls').remove();
  
  var controlsHtml = '<div class="fancybox-video-controls">' +
    '<div class="video-control-group">' +
    '<label>Speed:</label>' +
    '<button class="video-speed" data-speed="0.5">0.5x</button>' +
    '<button class="video-speed active" data-speed="1">1x</button>' +
    '<button class="video-speed" data-speed="1.5">1.5x</button>' +
    '<button class="video-speed" data-speed="2">2x</button>' +
    '</div>' +
    '<div class="video-control-group">' +
    '<label><input type="checkbox" class="video-loop"> Loop</label>' +
    '</div>' +
    '</div>';
  
  instance.$refs.container.find('.fancybox-content').append(controlsHtml);
  
  // Speed control handlers
  $('.video-speed').on('click', function() {
    var speed = parseFloat($(this).data('speed'));
    video.playbackRate = speed;
    $('.video-speed').removeClass('active');
    $(this).addClass('active');
  });
  
  // Loop control handler
  $('.video-loop').on('change', function() {
    video.loop = $(this).is(':checked');
  });
}

$(document).ready(function() {
  initFancybox();
});

// Handle PDF clicks
if (isMobile) {
  $(document).on('click', 'a[data-fancybox="gallery"]', function(e) {
    var href = $(this).attr('href') || $(this).attr('data-src');
    if (href && href.toLowerCase().endsWith('.pdf')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      var pdfUrl = href;
      if (!pdfUrl.startsWith('http')) {
        pdfUrl = window.location.origin + '/' + pdfUrl.replace(/^\/+/, '');
      }
      
      // Open directly in new tab - uses browser's native PDF viewer
      window.open(pdfUrl, '_blank');
      return false;
    }
  });
}

function updateTag(photoId, photoTag, newPhotoId){
  var controller = angular.element(document.querySelector('#controller')).scope();
	controller.updateTag(photoId, photoTag, newPhotoId);
	controller.$apply(); // need when data is changed	
}

function getMatchingTags(tag){
	var controller = angular.element(document.querySelector('#controller')).scope();
	return controller.getMatchingTags(tag);	
}

$('.pp-filter-button').on('click', function(e) {
  // remove btn-primary from all buttons first
  $('.pp-filter-button').removeClass('btn-primary');
  $('.pp-filter-button').addClass('btn-outline-primary');

  // add btn-primary to active button
  var button = $(this);
  button.removeClass('btn-outline-primary');
  button.addClass('btn-primary');
  filterItems(button.data("filter"));
  e.preventDefault();
})

function filterItems(filter) {
  if(filter === activeFilter) {
    return;
  }

  activeFilter = filter;
  $('.pp-gallery .card').each(function () {
    var card = $(this);
    var groups = card.data("groups");
    var show = false;
    if(filter === 'all') {
      show = true;
    }
    else {
      for(var i = 0; i < groups.length; i ++) {
        if(groups[i] === filter) {
          show = true;
        }
      }
    }
    // hide everything first
    card.fadeOut(400);

    setTimeout(function() {
      if(show && !card.is(":visible")) {
          card.fadeIn(400)
        }
      }, 500);
  });
}

function submitUpdateTagForm(formName, photoId){
   
	var form = $(formName);
	var photoTagValue = form.find('[name=phototag]')[0].value;
	var controller = angular.element(document.querySelector('#controller')).scope();
	controller.updatePhotoTag(photoId, photoTagValue);
	controller.$apply(); // need when data is changed	
	$(".modal").modal("hide");
}

var activeFilter = 'all';

// Detect mobile device
var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Track rotation state for each slide
var rotationAngles = {};

// Initialize Fancybox on gallery links
function initFancybox() {
  if (typeof $.fancybox === 'undefined') return;
  
  // Bind Fancybox to gallery links
  $('[data-fancybox="gallery"]').fancybox({
    loop: true,
    autoSize: true,
    buttons: [
      'zoom',
      'slideShow',
      'rotateLeft',
      'rotateRight',
      'close'
    ],
    // Custom button for rotate left
    btnTpl: {
      rotateLeft:
        '<button data-fancybox-rotate-left class="fancybox-button fancybox-button--rotate-left" title="Rotate Left (Counter-clockwise)">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z"/></svg>' +
        '</button>',
      rotateRight:
        '<button data-fancybox-rotate-right class="fancybox-button fancybox-button--rotate-right" title="Rotate Right (Clockwise)">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z"/></svg>' +
        '</button>'
    },
    beforeShow: function(instance, current) {
      // Reset rotation for this slide if not set
      if (!rotationAngles[current.index]) {
        rotationAngles[current.index] = 0;
      }
      
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
    },
    afterShow: function(instance, current) {
      var $container = instance.$refs.container;
      
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
    },
    beforeClose: function(instance, current) {
      // Keep rotation settings when closing (optional - can reset here if desired)
    }
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
	var values = {};
	$.each(form.serializeArray(), function (i, field) {
		values[field.name] = field.value;
	});
		
	$.post(form.attr('action'), form.serialize(), function(response){
		updateTag(photoId, values.tags, response);
	},'json');
	
	$.fancybox.close();
	return false;
}

function submitUploadForm(formName){
   
	var form = $(formName);
	var values = {};
	$.each(form.serializeArray(), function (i, field) {
		values[field.name] = field.value;
	});
	
	var file = $('input[type=file]')[0].files[0];
	var tags = values.tags;
	var album = values.album;
		
	var controller = angular.element(document.querySelector('#controller')).scope();
	controller.uploadFile(file, tags, album);
	controller.$apply();
	$.fancybox.close();
	return false;
}

function closeFancyBoxForm(){
   	$.fancybox.close();
	return false;
}

function clearTagBox(formSelector, fieldName) {
  var $form = $(formSelector);
  if (!$form.length) return;
  var form = $form[0]; // <- DOM form element
  var field = form.elements[fieldName] || form.querySelector('[name="'+fieldName+'"]');
  if (field) field.value = "";
}

function displayUploadedFile(input) {
	if (input.files && input.files[0]) {
		var reader = new FileReader();

		reader.onload = function (e) {
			$('#selectedFile')
				.attr('src', e.target.result)
				.width(300)
				.height(250);
		};

		reader.readAsDataURL(input.files[0]);
	}
}

//Get the gototop button
var goTopButton = document.getElementById("goTopBtn");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    goTopButton.style.display = "block";
  } else {
    goTopButton.style.display = "none";
  }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}
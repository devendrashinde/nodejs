var activeFilter = 'all';

// Detect mobile device
var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Initialize Fancybox on gallery links
function initFancybox() {
  if (typeof $.fancybox === 'undefined') return;
  
  // Bind Fancybox to gallery links
  $('[data-fancybox="gallery"]').fancybox({
    loop: true,
    autoSize: true,
    buttons: ['zoom', 'slideShow', 'close']
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
var activeFilter = 'all';

$('[data-fancybox="gallery"]').fancybox({
  buttons : [ 
    'slideShow',
    'share',
    'zoom',
    'fullScreen',
    'close'
  ],
  thumbs : {
    autoStart : true
  }
});

// Create templates for buttons
$.fancybox.defaults.btnTpl.exif = '<button data-fancybox-exif class="fancybox-button fancybox-button--exif" title="Show/Hide EXIF data (camera settings)"  onClick="javascript:toggleExif()" >' +
'<img src="res/exif.svg"  class="roundbutton"  alt="Show/Hide EXIF data (camera settings)" title="Show/Hide EXIF data (camera settings)" >'  +
  '</button>';

$('[data-fancybox="gallery"]').fancybox({
    buttons : [
    'zoom',
    'slideShow',
    'exif',
    'thumbs',
    'close'
  ]
	/*
	caption : function( instance, item ) {
        var caption = $(this).data('caption') || '';

        if ( item.type === 'image' ) {
			tagValue = angular.element('#controller').scope().getTag(item.src);
            caption = (tagValue.length ? tagValue : caption) + '<br />' + '<a href="' + item.src + '">Download image</a>' ;
			//angular.element('#controller').scope().$apply(); // need when data is changed
        }
        return caption;
    }
	*/
});

function updateTag(photoId, photoTag, newPhotoId){
	var controller = angular.element('#controller').scope();
	controller.updateTag(photoId, photoTag, newPhotoId);
	controller.$apply(); // need when data is changed	
}

function getMatchingTags(tag){
	var controller = angular.element('#controller').scope();
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

function submitUpdateTagForm(formName, tagName, photoId){
   
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
		
	var controller = angular.element('#controller').scope();
	controller.uploadFile(file, tags, album);
	controller.$apply();
	$.fancybox.close();
	return false;
}

function closeFancyBoxForm(formName, tagName){
   	$.fancybox.close();
	return false;
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
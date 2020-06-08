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

$('[data-fancybox="gallery"]').fancybox({
	caption : function( instance, item ) {
        var caption = $(this).data('caption') || '';

        if ( item.type === 'image' ) {
			tagValue = angular.element('#controller').scope().getTag(item.src);
            caption = (tagValue.length ? tagValue : caption) + '<br />' + '<a href="' + item.src + '">Download image</a>' ;
			//angular.element('#controller').scope().$apply(); // need when data is changed
        }
        return caption;
    }
});

function editTag(photoId, photoPath, photoTag) {

  var html = '<div class="message">';
  html += '<form action="/" method="post" id="form' + photoId + '">';
  html += '<h3> Update photo description</h3>';
  html += '<p><input type="hidden" name="name" value="' + photoPath + '"/>';
  html += '<textarea name="tags" rows=4 column=80>' +  photoTag + '</textarea></p>';
  html += '<p><input type="button" value="Update" onClick="submitFancyBoxForm(form' + photoId + ',tag' + photoId + ');"/></p>';
  html += '</form></div>';
  $.fancybox.open(html);

}

function updateTag(photoId, photoTag){
	var controller = angular.element('#controller').scope();
	controller.updateTag(photoId, photoTag);            
	controller.$apply(); // need when data is changed	
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

function submitAndClosePopup(formName, tagName, closeButton){
   
	var form = $(formName);
	
	/*
	$.post(form.attr('action'), form.serialize(), function(response){
		// do something here on success
	},'json');
	*/
	var values = {};
	$.each(form.serializeArray(), function (i, field) {
		values[field.name] = field.value;
	});
	$(tagName).text(values.tags);	
	$(closeButton).click();
	$.fancybox.close();
	return false;
}

function submitFancyBoxForm(formName, tagName, photoId){
   
	var form = $(formName);
		
	$.post(form.attr('action'), form.serialize(), function(response){
		// do something here on success
	},'json');
	
	var values = {};
	$.each(form.serializeArray(), function (i, field) {
		values[field.name] = field.value;
	});
	//$(tagName).text(values.tags);	
	updateTag(photoId, values.tags);
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
		
	var controller = angular.element('#controller').scope();
	controller.uploadFile(file, tags);
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

/*
function search() {
	var controller = angular.element('#controller').scope();
	controller.search();
	controller.$apply();
};

function clearSearch() {
	var controller = angular.element('#controller').scope();
	controller.clearSearch();
	controller.$apply();

};
*/
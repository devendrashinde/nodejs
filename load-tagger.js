

// When the DOM is ready, initialize the scripts.
jQuery(function( $ ){

	// Set up the photo tagger.
	$( "div.photo-container" ).photoTagger({

		// The API urls.
		loadURL: "./load_tags.cfm",
		saveURL: "./save_Tag.cfm",
		deleteURL: "./delete_tag.cfm",

		// Default to turned on.
		// isTagCreationEnabled: false,

		// This will allow us to clean the response from
		// a ColdFusion server (it will convert the
		// uppercase keys to lowercase keys expected by
		// the photoTagger plugin.
		cleanAJAXResponse: cleanColdFusionJSONResponse
	});


	// Hook up the enable create links.
	$( "a.enable-create" ).click(
		function( event ){
			// Prevent relocation.
			event.preventDefault();

			// Get the container and enable the tag
			// creation on it.
			$( this ).prevAll( "div.photo-container" )
				.photoTagger( "enableTagCreation" )
			;
		}
	);


	// Hook up the disabled create links.
	$( "a.disable-create" ).click(
		function( event ){
			// Prevent relocation.
			event.preventDefault();

			// Get the container and enable the tag
			// creation on it.
			$( this ).prevAll( "div.photo-container" )
				.photoTagger( "disableTagCreation" )
			;
		}
	);


	// Hook up the enable delete links.
	$( "a.enable-delete" ).click(
		function( event ){
			// Prevent relocation.
			event.preventDefault();

			// Get the container and enable the tag
			// deletion on it.
			$( this ).prevAll( "div.photo-container" )
				.photoTagger( "enableTagDeletion" )
			;
		}
	);


	// Hook up the disabled delete links.
	$( "a.disable-delete" ).click(
		function( event ){
			// Prevent relocation.
			event.preventDefault();

			// Get the container and disabled the tag
			// deletion on it.
			$( this ).prevAll( "div.photo-container" )
				.photoTagger( "disableTagDeletion" )
			;
		}
	);

});


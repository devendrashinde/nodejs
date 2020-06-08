angular.module('ModalService', [])

	.factory('ModalService', function() {
		var modals = []; // array of modals on the page
		return {
			Add : function(modal) {
				// add modal to array of active modals
				modals.push(modal);
			},
			Remove : function(id) {
				// remove modal from array of active modals
				var modalToRemove = _.findWhere(modals, { id: id });
				modals = _.without(modals, modalToRemove);
			},
			Open : function(id) {
				// open modal specified by id
				var modal = _.findWhere(modals, { id: id });
				modal.open();
			},
			Close: function (id) {
				// close modal specified by id
				var modal = _.findWhere(modals, { id: id });
				modal.close();
			}
		}
	});

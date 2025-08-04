angular.module('ModalDirective', [])
	.directive('comboHeader', ['$window', function($window) {
  return {
    restrict: 'A',
    link: function(scope, element) {
      let lastScrollTop = 0;
      let shrinkPoint = 50;   // when to shrink
      let hidePoint = 150;    // when to hide fully

      angular.element($window).on('scroll', function() {
        let st = $window.pageYOffset || document.documentElement.scrollTop;

        // Shrink after shrinkPoint
        if (st > shrinkPoint) {
          element.addClass('shrunk');
        } else {
          element.removeClass('shrunk');
        }

        // Hide after hidePoint, only when scrolling down
        if (st > lastScrollTop && st > hidePoint) {
          element.addClass('hidden-header');
        } else if (st < lastScrollTop) {
          element.removeClass('hidden-header');
        }

        lastScrollTop = st <= 0 ? 0 : st;
      });
    }
  };
}]);

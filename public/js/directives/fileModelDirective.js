angular.module('FileModel', [])

.directive('fileModel', ['$parse', function ($parse) {
        return {
			restrict: 'A', //the directive can be used as an attribute only
 
            /*
             link is a function that defines functionality of directive
             scope: scope associated with the element
             element: element on which this directive used
             attrs: key value pair of element attributes
             */			
           link: function(scope, element, attrs) {
              var model = $parse(attrs.fileModel);
              var modelSetter = model.assign;

              element.bind('change', function(){
                 scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                 });
              });
           }
        };
     }]);


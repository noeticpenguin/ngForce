app.directive('oppDetails', function(){
	return {
		restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
		templateUrl: '/apex/LABJS_oppDetailsTmpl',
		link: function($scope, iElm, iAttrs, controller) {
		}
	};
});
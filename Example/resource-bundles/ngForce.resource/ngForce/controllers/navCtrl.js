app.controller('navCtrl', function($scope, $rootScope, vfr, sfr, analytics) {

	var pStageNames = vfr.describePicklistValues('Opportunity', 'StageName');

	pStageNames.then(
		function(results){$scope.stageNames = results;},
		function(error){log(error);}
	);

	$scope.broadcastFilter = function(filterExp) {
		$rootScope.$broadcast('UpdateFilter', {'StageName' : filterExp});
	};

	$scope.addAccount = function() {
		var account = {Name: 'ABC Company', Industry: 'Manufacturing'};
		vfr.create('Account', JSON.stringify(account));
	};

});
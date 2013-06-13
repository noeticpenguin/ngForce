app.controller('accountAllCtrl', function($scope, $rootScope, $q, vfr) {

	/**
	 * Chaining example.
	 * In this example we execute 3 separate, soql queries and utilize ngForce's 
	 * promise interface to delay execution of an alert dialog.
	 */

	//Three Promises all alike in diginity here in fair js, where we set our stage.
	var pAccounts = vfr.query("SELECT Id, Active__c, Site, Type, Industry, Name, AccountNumber, NumberOfEmployees FROM Account");
	var pOpportunities = vfr.query("SELECT Id, Name FROM Opportunity");
	var pPricebookEntry = vfr.query("SELECT Id, Name from PricebookEntry");

	$scope.x = 0;

	pAccounts.then(function(results){
		$scope.accounts = results.records;
		$scope.x = 'accounts';
	});

	log("First report of x = " + $scope.x);

	pOpportunities.then(function(results){
		$scope.opps = results.records;
		$scope.x = 'opps';
	});

	log("Second Report of x = " + $scope.x);

	pPricebookEntry.then(function(results){
		$scope.products = results.records;
		$scope.x = 'products';
	});

	log("Third Report of x = " + $scope.x);

	var pFail = $q.defer();
	pFail.reject('Just demonstrating');

	// var transaction = $q.defer();
	$q.all(pAccounts, pOpportunities, pPricebookEntry).then(function(){
		$scope.x = 'all done';
		log("Final Report of x = " + $scope.x);
	});

	// var transaction2 = $q.defer();
	$q.all(pAccounts, pOpportunities, pPricebookEntry, pFail).then(function(){
		$scope.x = 'You should never see me.';
	},
	function(error){
		log(error);
	});
});
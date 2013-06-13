app.controller('accountCtrl', function($scope, $rootScope, $q, vfr) {

	/**
	 * Chaining example.
	 * In this example we execute 3 separate, but dependent soql queries and utilize ngForce's 
	 * promise interface to chain them together, ensuring proper order.
	 */

	//Initial Request for data
	vfr.query("SELECT Id, Active__c, Site, Type, Industry, Name, AccountNumber, NumberOfEmployees FROM Account")
		.then(function(accounts){
			// we can manipulate the results of this first query, even assign scope variables with it
			$scope.accounts = accounts.records;
			var accountIds = _.pluck(accounts.records, 'Id');
			accountIds = _.map(accountIds, function(id){ return "'" + id + "'";}).join(", ");
			// but we must!!! return a promise, like a new ngForce method call
			return vfr.query("SELECT Id, Name FROM Opportunity WHERE AccountId in (" + accountIds + ")");
		}).then(function(Opps){
			$scope.opps = Opps.records;
			oppIds = _.pluck(Opps.records, "Id"); //shoutout to underscorejs.org!
			oppIds = _.map(oppIds, function(id){ return "'" + id + "'";}).join(", ");
			return vfr.query("SELECT Id, PricebookEntry.Name, Quantity, UnitPrice FROM OpportunityLineItem WHERE OpportunityId in (" + oppIds + ")");
		}).then(function(products){
			$scope.products = products.records;
			return products;
		},
		// This last link in the chain is our error reporting link.
		// If / When any of the above promises is rejected, or fails to resolve
		// this method runs, and in our case logs the error.
		function(error){
			log(error);
		});

});
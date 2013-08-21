ngForce
=======

Force.com Angular.js framework.

You can find the production ready version of the library under js/ngForce/
ngForce depends on the safeApply module that you'll find in safeApply.js under js/ngForce

Note: this is distributed unminified so that you can minify it with the rest of your Angular.js code

Usage
======

During the creation of your application module, inject the ngForce dependcy thusly:
```javascript
var app = angular.module('ngForceDemo', ['ui.bootstrap', 'ui', 'ngForce']);
```

Once your app Module has been defined, you can include the service ngForce provides, 'vfr' in any of your controllers by adding it to the dependency injection list like this:
```javascript
app.controller('oppBoxCtrl', function($scope, $dialog, vfr)
```

Note: It probably seems strange that the module is named ngForce, but the service you're injecting is called vfr. ngForce will eventually support not only Visual Force Remoting (VFR) but also javascript ajax calls to the Rest api. The in-progress Rest service will be named, "sfRestApi". The module ngForce, however, provides both, hence the odd naming.

Thereafter in the controller you can utilize the vfr service much like the $http, or $q services in Angular.
vfr returns a promise, and therefore your controllers can have a clean(er), less call-back-hell flow to them. Additionally, because promises are binary, you can group vfr callouts and act on that data only once all of the promises have resolved. For example, here's a simple SOQL query returning records via promise:

Why is this important?
======================
The Deferred / Promise pattern in Angular is a simplified version of the Q library by Kris Kowal (https://github.com/kriskowal/q) It provides a deferred object prototype with, as of Angular.js 1.1.5, just two methods, resolve and reject; and a singular property: promise. 
The promise object held by the deferred object's promise property has a single method, .then() which is used to complete promises. 
Finally, Angular provides the $q service, which provides the constructor for building deferred objects, as well as an additional two methods, .all() and .when() 

Semantically, these are combined with the logic that you Defer some *work* with the *promise* to complete it, and *then* once it's complete, you act on it.

Say more, How do I do that?

```javascript
var pOppQuery = vfr.query("SELECT Id, Name, Account.Name, LeadSource, Probability, CloseDate, StageName, Amount FROM Opportunity ORDER BY CloseDate DESC");
pOppQuery.then(function(d) {
	$scope.opportunities = d.records;
});
```

In our example above, we're calling the vfr service to make a SOQL query. This is our act of *deferring* some work -- querying Salesforce --. Vfr returns a *promise* to complete that work, which we assign to the variable pOppQuery. We call the .then() method to do some work when our promised work has been completed. 

Now, if that was the extent of what you could do with Deferred / Promises it'd be a nice improvement over callback hell. However, the fun doesn't end there. If your .then() method returns a promise, you can create chains promise execution -- enforcing order execution amidst asynchronous work. Here's what that looks like:

```javascript
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
```

While the above example is contrived, this pattern is extremely useful when you're creating, for instance, an object with several child objects. In the first promise you create the parent object, and in the following promise you create the first child object -- in this second promise you'll have access to the Id of the created object, etc. 

Finally, at the very end of the chain, you can append an error handling function. If any of the promises are rejected the following promises will also be rejected passing the error message on to the error function.

Addtionally, the $q service provides the .all() method. If you're familiar with the jQuery Deferred / Promise interface the all() method is functionally identical to the jquery $.when() method. In Angular, you utilize it this way:

```javascript
var pQuery1 = vfr.query("Select Id from Account");
var pQuery2 = vfr.query("Select Id from Contact");

$q.all(pQuery1, pQuery2).then(function{
	// Both of these promises are guaranteed to be completed successfully.
});
``` 

Using the helper methods
========================

ngForce provides some helper methods that are intended to make the developers life simpler. Most of these are self explanitory but a couple of them are a bit more esoteric. 

Perhaps the most confusing is the bulkCreate method. You can invoke the bulk create method thusly:
```javascript
var pBulkCreateCall = vfr.bulkCreate('objectName__c', dataRows);
pBulkCreateCall.then(function(results){
	//do something awesome with results
});

// dataRows is a numerically key'd object of objects. like this:
{
	"0":{"propA":3,"End_date__c":"2013-08-21T11:29:27.365Z"},
	"1":{"propA":3,"End_date__c":"2013-08-21T11:29:27.365Z"},
	"2":{"propA":3,"End_date__c":"2013-08-21T11:29:27.365Z"},
	"3":{"propA":3,"End_date__c":"2013-08-21T11:29:27.365Z"},
	"4":{"propA":3,"End_date__c":"2013-08-21T11:29:27.365Z"},
	"5":{"propA":3,"End_date__c":"2013-08-21T11:29:27.365Z"},
	"6":{"propA":3,"End_date__c":"2013-08-21T11:29:27.365Z"},
	"7":{"propA":3,"End_date__c":"2013-08-21T11:29:27.365Z"},
	"8":{"propA":3,"End_date__c":"2013-08-21T11:29:27.365Z"},
	"9":{"propA":3,"End_date__c":"2013-08-21T11:29:27.365Z"},
	"10":{"propA":3,"End_date__c":"2013-08-21T11:29:27.365Z"},
	"11":{"propA":3,"End_date__c":"2013-08-21T11:29:27.365Z"}
}

// I generated that with: 
var dataRows = {};
for(var i=0; i < 12; i++) {
	dataRows[i] = {'propA':3, 'End_date__c': new Date()};
}

// Each of the child objects should be independently insertable via the vfr.create method -- 
// ie: should be a json representation of the object.

```

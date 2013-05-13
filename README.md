ngForce
=======

Force.com Angular.js framework.

You can find the production ready version of the library under js/ngForce/

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

Thereafter in the controller you can utilize the vfr service much like the $http, or $q services in Angular.
vfr returns a promise, and therefore your controllers can have a clean(er), less call-back-hell flow to them. Additionally, because promises are binary, you can group vfr callouts and act on that data only once all of the promises have resolved. For example, here's a simple SOQL query returning records via promise:

```javascript
	var pOppQuery = vfr.query("SELECT Id, Name, Account.Name, LeadSource, Probability, CloseDate, StageName, Amount FROM Opportunity ORDER BY CloseDate DESC");
	pOppQuery.then(function(d) {
		$scope.opportunities = d.records;
		if(!$scope.$$phase) {
			$scope.$digest();
		}
	});
	``` 

Why is this important?
======================
Angular requires you, the developer, to forcibly update the $scope using $scope.$apply, or better yet $scope.$digest whenever you consume data from an external service, such as a custom api like Salesforce / apex. The promise backed interface that ngForce exposes allows you to run the N number of queries needed to display the page, and *yet only update the $scope once.* 

Say more, How do I do that?

You can also execute several promises and delay the execution of a singular callback to handle all of them: 
```javascript
var pQuery1 = vfr.query("Select Id from Account");
var pQuery2 = vfr.query("Select Id from Contact");

$.when(pQuery1, pQuery2).done(function{
	//now do stuff! with both data sets
	//...
	//now update the scope.
	//if(!$scope.$$phase) {
	//	$scope.$digest();
	//}
});
``` 



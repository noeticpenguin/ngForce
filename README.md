![ngForce Logo](https://raw.githubusercontent.com/noeticpenguin/ngForce/master/images/logo_128x128.png)
ngForce is a set of Angular.js modules that facilitate quick and sustainable Angular.js application development on the Force.com Platform. With the Angular.js modules are a set of Apex classes facilitating Visualforce Remoting. 

##Architectural Overview.
ngForce is composed of a number of independent modules that are normally comiled/minified into a single .min.js file for use. However, advanced developers can adopt singular modules from the jsSrc directory, so long as the underlying requirements for ngForce are met:

1. Lo-Dash.js (or Underscore, but Lo-Dash is significantly faster)
2. safeApply.js - An Angular module in it's own right, this module provides a fire and forget method of syncing external data retreival with the Angular Run loop.
3. The sfr* services all require Restangular.js, an Angular.js module for better integration with mostly restful apis.

#Services Overview.
## /jsSrc/ngForce-visualForceRemoting.js
This service provides methods for interacting with the force.com platform without burning API calls. It does this by providing both a generic Angular-ized wrapper for *Any visualforce remoting annotated method* in your org, as well as a set of pre-wired convienence methods from the acompanying ngForceController.cls. These largely handle CRUD, Bulk Create and Update as well as manipulation of fieldsets. 
### Methods of Note:
vfr.send() - Send gives you the ability to on-demand generate a function that make a JSRemoting call to any @remoteAction annotated method in your org. This method accepts a fully qualified && namespaced method name specifying the remoteAction method to invoke as well as an Options hash and a boolean parameter determining if the remoteAction method is allowed to return a null response object. (for instance, delete.) *This method returns a function that, when invoked, makes a promised based visualforce remoting call* Using .send() you can:

```javascript
	var makeChatterPost = vfr.send('Example.Controller.Method', options, false); 
```

once in your service, controller or app definition. Then you can call the method 

```javascript 
makeChatterPost("foo bar baz!");
```

to trigger the VisualForce Remoting call. 
There are a number of convience methods pre-wired into the vfr module such as: 

+ bulkCreate
+ bulkUpdate
+ create
+ clone
+ del
+ describe
+ describeFieldSet
+ describePicklistValues
+ getObjectType
+ getQueryResultsAsSelect2Data
+ query
+ queryFromFieldset
+ retrieve
+ search
+ soqlFromFieldSet
+ update
+ upsert

**Please note, This is a provider and as such, you can override the default "standardOptions" used by .send() and consequently by the convience methods in your app.setup method.**

## /jsSrc/ngForce-sfTemplate.js
This service provides methods for optimizing and "pre-building" Angular views from Visualforce .pages in your org. Salesforce, (as of Spring 14) still injects a number of javascript tags into the .HTML that the Visualforce engine generates. Some of these .js files are not well optimized for compositing complex views from partial templates. While loading any given single partial has a negligable impact on application speed from these scripts, compositing a page out of 15 partials *does*. This service, in conjunction with the AngularTemplateCache service, provides a way to pre-fetch the view, strip the extra .js include tags and push the HTML into the $TemplateCache. There is a noticable improvement in application load times using this. 
* This Method is also a provider, and allows you to reset the standard regex blacklist in the app.setup method. *
###Methods of Note:
fromVf() - This method requests the template from Salesforce and utilizes the preset blacklist regex and strips offending js include statements from the fetched templates before inserting the template into the cache.

## /jsSrc/ngForce-sfrQuery
This service is *the* service by which one queries records in Salesforce via the *rest* api. It is entirely promise based and will as soon as the request has been *sent* to Salesforce. 

###Methods of Note:
Query() - the query method accepts a string representation of a *soql* query. This query is handed - as is - to Salesforce only manipulating the string to ensure url-encodedness. Depending on the Query itself, the result will usually be an object of objects representing the resulting rows from Salesforce. Each of the rows returned is, itself a fully activated objects with the ability to call Update() etc.

QueryAll() - This method is a double edged sword. If you need to have more than 2k records returned, this is the easiest method to do so. On the other hand, without an intentional Upper boundry in the query string itself, you can easily pull down 28k records. This will run your user's box out of memory, freeze their browser and in all likelyhood run you out of API calls if multiple people are using the service. *use wisely*

## /jsSrc/ngForce-sfrBackend
This service facilitates testing by providing custom expectations, mocks and testing utilities. 

## /jsSrc/ngForce-sfrAnalytics.js
This service provides access to the Analytics Rest Api. 

### Feel free to submit pull requests with more documentation on this one.

## /jsSrc/ngForce-sfr.js
This is the main *rest* api service. It provides four main methods:

1. Model: this method returns a restangular object configured
   for crud operations via the standard .post .get etc. methods 
   of restanglar. 
2. Insert: A convience method, for ... inserting records.
3. Update: A convience method, for ... updating records.
4. Delete: a convience method, for ... deleting records.

What's important to know about the SFR service is that your queried object results return as a collection of SFR service enabled objects. Given a result set, each record has, for instance, an update() method.

## /jsSrc/ngForce-remoteObjects.js
This service exposes a factory for building Remote Object methods. This is the newest service and as such has had the least amount of real-world testing. 

## /jsSrc/ngForce-encodeUriQuery.js
This service is used internally by the sfrBackground service to enable better testing.

Usage
======

During the creation of your application module, inject the ngForce dependcy thusly:

```javascript
var app = angular.module('myAwesomeAngularOnSalesforceApp', ['ngForce']);
```

Once your app Module has been defined, you can include the service ngForce provides, 'vfr' in any of your controllers by adding it to the dependency injection list like this:

```javascript
app.controller('oppBoxCtrl', function($scope, $dialog, vfr)
```

Thereafter in the controller you can utilize the ngForce services much like the $http, or $q services in Angular.
vfr, sfr, sfrquery and all the others return promises, and therefore your services can have a clean(er), less call-back-hell flow to them. 

##Grunt tasks
We use Grunt to not only minify and combine the JS sources, but also to build a .staticResource file and deploy it to Salesforce orgs. In addition to the static resource with the JS files, the grunt deploy tasks push the ngForceController.cls and it's two test classes. The deploy process is interactive, and requires you to know your login, password and Security token. Here's a list of useful grunt tasks, and what they do:

```
default          => Alias for "min" task.
deploy           => Refreshes resources and deploys to selected env (test|prod)
min              => Custom task.
ngmin             > Annotate AngularJS scripts for minification
refreshResources => Refresh the staticResource.zip files
tasks            => Alias for "availabletasks" task.
uglify            > Minify files with UglifyJS. (ngForce|requirements|oneFile)
```

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

This pattern is extremely useful when you're creating, for instance, an object with several child objects. In the first promise you create the parent object, and in the following promise you create the first child object -- in this second promise you'll have access to the Id of the created object, etc. 

Finally, at the very end of the chain, you can append an error handling function. If any of the promises are rejected the following promises will also be rejected passing the error message on to the error function.

Addtionally, the $q service provides the .all() method. If you're familiar with the jQuery Deferred / Promise interface the all() method is functionally identical to the jquery $.when() method. In Angular, you utilize it this way:

```javascript
var pQuery1 = vfr.query("Select Id from Account");
var pQuery2 = vfr.query("Select Id from Contact");

$q.all(pQuery1, pQuery2).then(function{
	// Both of these promises are guaranteed to be completed successfully.
});
``` 

Using the vfr helper methods
========================

vfr provides some helper methods that are intended to make the developers life simpler. Most of these are self explanitory but a couple of them are a bit more esoteric. 

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

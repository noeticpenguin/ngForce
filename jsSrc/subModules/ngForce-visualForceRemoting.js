/*
 * ngForce - a visualForce remoting based Angular.js service for developing
 * Angular apps within Visualforce.
 *
 * Copyright (c)2013, Kevin Pooorman.
 * License: MIT
 *
 * Vfr provides access to visualforce Remoting methods from any given class
 * in the Org that are @remoteAction annotated.
 *
 * While ngForce comes with a standard set of crud based operations based on
 * TKForce by @metadaddy, developers should pay specific attention to
 * the .send() method, which enables bootstraping any class.method so long
 * as it's a legit js Remoting action.
 *
 */
angular.module('ngForce')
	.provider('vfr', function() {
		/**
		 * Object contains the two standard fields needed by the .send method: escape and timeout.
		 * escape: Should the result be escape. default to false.
		 * timeout: set the timeout for visualforce to respond.
		 * @type {Object}
		 */
		var standardOptions = {
			escape: false,
			timeout: 10000
		};

		// Force shutdown the VFR provider / factory if VisualForce is not already an object on window.
		if (typeof Visualforce != 'object') {
			throw new Error('Visualforce is not available as an object! Did you forget to include the ngForce component?');
		}
		var vfRemote = {};

		return {
			setStandardOptions: function(newOptions) {
				if (newOptions && typeof newOptions !== 'object') {
					throw new Error('standardOptions must be an object');
				}
				standardOptions = newOptions;
			},
			$get: function($q, $rootScope) {
				return {
					/*
					 * Kevin o'Hara released premote, a nice lib for wrapping
					 * visualforce remoting calls in a promise interface. this
					 * function .send() is largely a gentle refactoring of his
					 * work, found in "premote" here:
					 *    https://github.com/kevinohara80/premote
					 * such that it locks into the ng exec loop and utilizes
					 * the angular $q service, itself based on the Q lib
					 * Kevin uses.
					 */
					/**
					 * Returns a function that, when called, invokes the js
					 * remoting method specified in this call.
					 * @param  {String}   remoteAction class.methodName string representing the Apex className and Method to invoke
					 * @param  {Object}   options      Ojbect containing at least the timeout and escaping options. Passed to Remoting call
					 * @param  {Boolean}  nullok       Can this method return null and it be OK?
					 * @return {Function}              Function engaged with the NG execution loop, making Visualforce remoting calls.
					 */
					send: function(remoteAction, options, nullok) {
						var namespace, controller, method;
						var Manager = Visualforce.remoting.Manager;
						var parts = remoteAction.split('.');
						if (options && typeof options !== 'object') {
							throw new Error('Options must be an object');
						}
						if (parts.length < 2) {
							throw new Error('Invalid Remote Action specified. Use Controller.MethodName or $RemoteAction.Controller.MethodName');
						} else {
							if (parts.length === 3) {
								namespace = parts[0];
								controller = parts[1];
								method = parts[2];
							} else if (parts.length === 2) {
								controller = parts[0];
								method = parts[1];
							}
						}
						return function() {
							var deferred = $q.defer();
							var args;
							if (arguments.length) {
								args = Array.prototype.slice.apply(arguments);
							} else {
								args = [];
							}
							args.splice(0, 0, remoteAction);
							args.push(function(result, event) {
								handleResultWithPromise(result, event, nullok, deferred);
							});
							if (options) {
								args.push(options);
							}
							Manager.invokeAction.apply(Manager, args);
							return deferred.promise;
						};
					},
					/**
					 * Method returns an Angular promise as the product of a .send() prototyped method call
					 * @param  {String}   result   Raw JSON string returned by js Remoting call
					 * @param  {Object}   event    Status object returned from SF detailing errors, if any.
					 * @param  {Boolean}  nullok   Can the result be null?
					 * @param  {Deferred} deferred Angular Promise object
					 * @return {Deferred}          Angular promise with resolution
					 */
					handleResultWithPromise: function(result, event, nullok, deferred) {
						if (result) {
							if (typeof result !== 'object') {
								result = JSON.parse(result);
							}
							if (Array.isArray(result) && result[0].message && result[0].errorCode) {
								deferred.reject(result);
								$rootScope.$safeApply();
							} else {
								deferred.resolve(result);
								$rootScope.$safeApply();
							}
						} else if (typeof nullok !== 'undefined' && nullok) {
							deferred.resolve();
							$rootScope.$safeApply();
						} else {
							deferred.reject({
								message: 'Null returned by RemoteAction not called with nullOk flag',
								errorCode: 'NULL_RETURN'
							});
							$rootScope.$safeApply();
						}
					},
					// Bulk Create
					bulkCreate: function() {
						send('ngForceController.bulkCreate', standardOptions, false);
					},
					// Bulk Update
					bulkUpdate: function() {
						send('ngForceController.bulkUpdate', standardOptions, false);
					},
					// Create
					create: function() {
						send('ngForceController.create', standardOptions, false);
					},
					// Clone
					clone: function() {
						send('ngForceController.sObjectKlone', standardOptions, false);
					},
					// Delete
					del: function() {
						send('ngForceController.del', standardOptions, true);
					},
					// Describe
					describe: function() {
						send('ngForceController.describe', standardOptions, false);
					},
					// Describe Field Set
					describeFieldSet: function() {
						send('ngForceController.describeFieldSet', standardOptions, false);
					},
					// Describe Picklist Values
					describePicklistValues: function() {
						send('ngForceController.getPicklistValues', standardOptions, false);
					},
					// Get Object Type
					getObjectType: function() {
						send('ngForceController.getObjType', standardOptions, false);
					},
					// Get Query Results as select2 data
					getQueryResultsAsSelect2Data: function() {
						send('ngForceController.getQueryResultsAsSelect2Data', standardOptions, false);
					},
					// Query
					query: function() {
						send('ngForceController.query', {
							escape: false,
							timeout: 30000
						}, false);
					},
					// Query from Fieldset
					queryFromFieldset: function() {
						send('ngForceController.queryFromFieldSet', {
							escape: false,
							timeout: 30000
						}, false);
					},
					// Retrieve a field list for a given object.
					retrieve: function() {
						send('ngForceController.retrieve', standardOptions, false);
					},
					// Search (SOSL)
					search: function() {
						send('ngForceController.search', standardOptions, false);
					},
					// Soql from Fieldset
					soqlFromFieldSet: function() {
						send('ngForceController.soqlFromFieldSet', standardOptions, false);
					},
					// Update
					update: function() {
						send('ngForceController.updat', standardOptions, true);
					},
					// Upsert
					upsert: function() {
						send('ngForceController.upser', standardOptions, true);
					}
				};
			}
		};
	});
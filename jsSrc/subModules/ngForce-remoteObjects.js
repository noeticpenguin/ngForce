/*
 * ngForce - a visualForce remoting based Angular.js service for developing
 * Angular apps within Visualforce.
 *
 * Copyright (c)2013, Kevin Pooorman.
 * License: MIT
 *
 * remoteObjects provides access to Visualforce Remote Objects
 * api made available in api version 29.0
 *
 * Special thanks to Matt Welch @_MattWelch_ for giving me the idea
 * for this, and for prototyping an example in vanilla js found here
 * https://github.com/mattwelch/makeDeferredProvider/blob/master/makeDeferredProvider.js
 * And for being generally awesome.
 *
 */
angular.module('ngForce')
	.provider('remoteObjects',
		function() {
			// default namespace
			var namespace = "SObjectModel";
			// app.config setter for the namespace.
			this.setNamespace = function(newNamespace) {
				if (!_.isUndefined(newNamespace)) {
					namespace = newNamespace;
				}
			};
			this.$get = function($q, $log) {
				var remoteObjects = {
					getPromiseObj: function(obj) {
						var promisedObj = {};
						promisedObj.remoteObj = new namespace[obj]();

						promisedObj.retrieve = function(options) {
							promisedObj.remoteObj.retrieve(opts, this.handleWithPromise);
						};

						promisedObj.create = function(fvs) {
							fvs = fvs ? fvs : promisedObj.remoteObj._props;
							promisedObj.remoteObj.create(fvs, handleWithPromise);
						};

						promisedObj.update = function(ids, fvs) {
							if (!angular._isArray(ids)) {
								fvs = ids;
								ids = null;
							}

							ids = ids ? ids : [promisedObj.remoteObj._props.Id];
							fvs = fvs ? fvs : promisedObj.remoteObj._props;

							promisedObj.remoteObj.update(ids, fvs, handleWithPromise);
						};

						promisedObj.del = function(ids) {
							ids = ids ? ids : [promisedObj.remoteObj._props.Id];
							promisedObj.remoteObj.del(ids, handleWithPromise);
						};

						handleWithPromise = function(err, records, e) {
							var deferred = $q.defer();
							if (err) {
								deferred.reject(err);
							} else {
								if (e) {
									deferred.resolve(records, e);
								} else {
									deferred.resolve(records);
								}
							}
							return deferred.promise;
						};

						return promisedObj;
					}
				};

				return remoteObjects;
			};
		}
);
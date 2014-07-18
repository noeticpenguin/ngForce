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
angular.module('ngForce').provider('vfr', '$q', [function () {
    this.$get = function ($q, $rootScope) {
      // Force shutdown the VFR provider / factory if VisualForce is not already an object on window.
      if (typeof Visualforce != 'object') {
        throw new Error('Visualforce is not available as an object! Did you forget to include the ngForce component?');
      }
      var vfRemote = {};
      /*
			 * Kevin o'Hara released premote, a nice lib for wrapping
			 * visualforce remoting calls in a promise interface. this
			 * function .send() is largely a gentle refactoring of his
			 * work, found in "premote" here:
			 *		https://github.com/kevinohara80/premote
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
      vfRemote.send = function (remoteAction, options, nullok) {
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
        return function () {
          var deferred = $q.defer();
          var args;
          if (arguments.length) {
            args = Array.prototype.slice.apply(arguments);
          } else {
            args = [];
          }
          args.splice(0, 0, remoteAction);
          args.push(function (result, event) {
            handleResultWithPromise(result, event, nullok, deferred);
          });
          if (options) {
            args.push(options);
          }
          Manager.invokeAction.apply(Manager, args);
          return deferred.promise;
        };
      };
      /**
			 * Method returns an Angular promise as the product of a .send() prototyped method call
			 * @param  {String}   result   Raw JSON string returned by js Remoting call
			 * @param  {Object}   event    Status object returned from SF detailing errors, if any.
			 * @param  {Boolean}  nullok   Can the result be null?
			 * @param  {Deferred} deferred Angular Promise object
			 * @return {Deferred}          Angular promise with resolution
			 */
      function handleResultWithPromise (result, event, nullok, deferred) {
        if (result) {
      		if(typeof result !== 'object') {
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
      };
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
      /*
			 * This is the setter for standard options, so a config block can overwrite
			 */
      this.setStandardOptions = function (newOptions) {
        if (newOptions && typeof newOptions !== 'object') {
          throw new Error('standardOptions must be an object');
        }
        standardOptions = newOptions;
      };
      // Bulk Create
      vfRemote.bulkCreate = vfRemote.send('ngForceController.bulkCreate', standardOptions, false);
      // Bulk Update
      vfRemote.bulkUpdate = vfRemote.send('ngForceController.bulkUpdate', standardOptions, false);
      // Create
      vfRemote.create = vfRemote.send('ngForceController.create', standardOptions, false);
      // Clone
      vfRemote.clone = vfRemote.send('ngForceController.sObjectKlone', standardOptions, false);
      // Delete
      vfRemote.del = vfRemote.send('ngForceController.del', standardOptions, true);
      // Describe
      vfRemote.describe = vfRemote.send('ngForceController.describe', standardOptions, false);
      // Describe Field Set
      vfRemote.describeFieldSet = vfRemote.send('ngForceController.describeFieldSet', standardOptions, false);
      // Describe Picklist Values
      vfRemote.describePicklistValues = vfRemote.send('ngForceController.getPicklistValues', standardOptions, false);
      // Get Object Type
      vfRemote.getObjectType = vfRemote.send('ngForceController.getObjType', standardOptions, false);
      // Get Query Results as select2 data
      vfRemote.getQueryResultsAsSelect2Data = vfRemote.send('ngForceController.getQueryResultsAsSelect2Data', standardOptions, false);
      // Query
      vfRemote.query = vfRemote.send('ngForceController.query', {
        escape: false,
        timeout: 30000
      }, false);
      // Query from Fieldset
      vfRemote.queryFromFieldset = vfRemote.send('ngForceController.queryFromFieldSet', {
        escape: false,
        timeout: 30000
      }, false);
      // Retrieve a field list for a given object.
      vfRemote.retrieve = vfRemote.send('ngForceController.retrieve', standardOptions, false);
      // Search (SOSL)
      vfRemote.search = vfRemote.send('ngForceController.search', standardOptions, false);
      // Soql from Fieldset
      vfRemote.soqlFromFieldSet = vfRemote.send('ngForceController.soqlFromFieldSet', standardOptions, false);
      // Update
      vfRemote.update = vfRemote.send('ngForceController.updat', standardOptions, true);
      // Upsert
      vfRemote.upsert = vfRemote.send('ngForceController.upser', standardOptions, true);
      return vfRemote;
    };
  }]);

/*
 * ngForce - a visualForce remoting based Angular.js service for developing
 * Angular apps within Visualforce.
 *
 * Copyright (c)2013, Kevin Pooorman.
 * License: MIT
 *
 * Sfr provides access to the various REST based api's that 
 * Salesforce offers. This is most-useful when utilizing an 
 * angular on Visualforce page when the data volume starts
 * making vfr impractical.
 *
 * sfr exposes four methods:
 *   1. Model: this method returns a restangular object configured
 *   for crud operations via the standard .post .get etc. methods 
 *   of restanglar. 
 *   2. Insert: A convience method, for ... inserting records.
 *   3. Update: A convience method, for ... updating records.
 *   4. Delete: a convience method, for ... deleting records.
 * 
 */
angular.module('ngForce').factory('sfr', [
  '$q',
  '$rootScope',
  'Restangular',
  '$log',
  function ($q, $rootScope, Restangular, $log) {
    var sobjectEndpoints = [];
    // sObjectName => restangularObject
    var recordEndpoints = [];
    // recordId => restangularObject
    var sfRest = {
        model: function (modelName, recordId) {
          var baseResource = Restangular.setDefaultHeaders({ 'Authorization': 'Bearer ' + window.apiSid }).setBaseUrl('/services/data/v29.0/sobjects/').setRestangularFields({
              id: 'Id',
              selfLink: 'attributes.url'
            });
          var resource;
          if (recordId)
            // ../sobjects/{modelName}/{recordId}
            resource = baseResource.one(modelName, recordId);
          else
            // ../sobjects/{modelName}
            resource = baseResource.all(modelName);
          return resource;
        },
        insert: function (sObjectName, recordToInsert, getLatest) {
          var $defer = $q.defer();
          // Guard against inputs.
          if (!angular.isString(sObjectName)) {
            $defer.reject('An sObject name is required to perform insert.');
            return $defer.promise;
          }
          var _getLatest = angular.isDefined(getLatest) ? getLatest : false;
          // Default to getLatest
          // Find the right REST endpoint for the sObject.
          var sObjectEndpoint = sobjectEndpoints[sObjectName];
          if (angular.isUndefined(sObjectEndpoint)) {
            sObjectEndpoint = this.model(sObjectName);
            sobjectEndpoints[sObjectName] = sObjectEndpoint;
          }
          // Insert the new record.
          return sObjectEndpoint.post(recordToInsert).then(function (response) {
            if (response.success) {
              $log.debug('ngForce: Created new ' + sObjectName + ' record:', response);
              $defer.resolve(response);
              if (!_getLatest) {
                return $defer.promise;
              }
              // Get the new record's fields.
              return sObjectEndpoint.get(response.id).then(function (newRecord) {
                $log.debug('ngForce: Inserted:', newRecord);
                return newRecord;
              });
            } else {
              $defer.reject('Insert failed: [' + response.errors + '] Full response: ' + response);
            }
            return $defer.promise;
          });
        },
        update: function (sObjectName, recordToUpdate, getLatest) {
          var $defer = $q.defer();
          // Guard against inputs.
          if (!angular.isString(sObjectName)) {
            $defer.reject('An sObject name is required to perform an update.');
            return $defer.promise;
          }
          var _getLatest = angular.isDefined(getLatest) ? getLatest : false;
          // Default to getLatest
          var recordId = recordToUpdate.id || recordToUpdate.Id;
          if (!angular.isString(recordId)) {
            $defer.reject('An "Id" field is required to perform an update.');
            return $defer.promise;
          }
          // Find the right REST endpoint for the sObject.
          // Get the endpoint for the record.
          var recordEndpoint = recordEndpoints[recordId];
          if (angular.isUndefined(recordEndpoint)) {
            recordEndpoint = this.model(sObjectName, recordId);
            recordEndpoints[recordId] = recordEndpoint;
          }
          // Remove fields we can't update.
          var propsToIgnore = [
              'Id',
              'LastReferencedDate',
              'LastModifiedById',
              'LastModifiedDate',
              'LastViewedDate',
              'SystemModstamp',
              'CreatedById',
              'CreatedDate',
              'IsDeleted'
            ];
          for (var i = 0; i < propsToIgnore.length; i++) {
            var p = propsToIgnore[i];
            delete recordToUpdate[p];
          }
          // Update the record.
          return recordEndpoint.patch(recordToUpdate).then(function (response) {
            $log.debug('ngForce: Patched ' + sObjectName + ' record:', recordToUpdate);
            if (!_getLatest) {
              $defer.resolve('Patch successful!');
              return $defer.promise;
            }
            // Get the new record's fields.
            return recordEndpoint.get().then(function (newRecord) {
              $log.debug('ngForce: Updated ' + sObjectName + ' record:', response);
              return newRecord;
            });
          });
        },
        delete: function (sObjectName, recordToDelete) {
          var $defer = $q.defer();
          // Guard against inputs.
          if (!angular.isString(sObjectName)) {
            $defer.reject('An sObject name is required to perform a delete.');
            return $defer.promise;
          }
          var recordId = recordToDelete.id || recordToDelete.Id;
          if (!angular.isString(recordId)) {
            $defer.reject('An "Id" field is required to perform a delete.');
            return $defer.promise;
          }
          // Find the right REST endpoint for the sObject.
          // Get the endpoint for the record.
          var recordEndpoint = recordEndpoints[recordId];
          if (angular.isUndefined(recordEndpoint)) {
            recordEndpoint = this.model(sObjectName, recordId);
            recordEndpoints[recordId] = recordEndpoint;
          }
          // Delete the record.
          return recordEndpoint.remove().then(function (response, err) {
            $log.debug('ngForce: Deleted ' + sObjectName + ' record:', recordId);
            $defer.resolve('Delete successful!');
            return $defer.promise;
          });
        }
      };
    return sfRest;
  }
]);
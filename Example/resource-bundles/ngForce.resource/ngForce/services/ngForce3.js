/*
 * ngForce - a visualForce remoting based Angular.js service for developing
 * Angular apps within Visualforce.
 *
 * Copyright (c)2013, Kevin Pooorman.
 * License: MIT
 *
 * Usage:
 *   This is modeled after the Angular builtin's $http and $resource modules
 *   Injection of this service into your controller, etc. exposes the
 *   ngForce object, and it's methods to your controller. These methods expose
 *   access via promise-based asyncronous Visualforce Remoting.
 *
 * This module requires two external modules:
 *  1. safeApply: This handles wrapping calls to salesforce into the angular
 *    event loop
 *  2. Restangular: a library for handling rest based http calls.
 *
 */

angular.module('ngForce', ['Scope.safeApply', 'restangular'])
  .provider('vfr', [function($q, $rootScope) {
    if (typeof Visualforce != "object") {
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

    vfRemote.send = function(remoteAction, options, nullok) {
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
    };

    handleResultWithPromise = function(result, event, nullok, deferred) {
      if (result) {
        result = JSON.parse(result);
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
          message: "Null returned by RemoteAction not called with nullOk flag",
          errorCode: "NULL_RETURN"
        });
        $rootScope.$safeApply();
      }
    };

    /*
     * Setup for ngForce3 style func calls
     */
    var standardOptions = {
      escape: false,
      timeout: 10000 // 1 second timeout
    };

    /*
     * This is the setter for standard options, so a config block can overwrite
     */
    this.setStandardOptions = function(newOptions) {
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
  }])
  .provider('sfr', [function($q, $rootScope, Restangular){
    //provide a setter for the api version
    var apiVersion = 'v29.0';
    this.setApiVersion = function(newVersion) {
      apiVersion = newVersion;
    };

    var sobjectEndpoints = []; // sObjectName => restangularObject
    var recordEndpoints = []; // recordId => restangularObject
    var sfRest = {
      model: function(modelName, recordId) {
        var baseResource = Restangular.
        setDefaultHeaders({
          'Authorization': 'Bearer ' + window.apiSid
        }).
        setBaseUrl('/services/data/'+ apiVersion +'/sobjects/').
        setRestangularFields({
          id: "Id",
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
      insert: function(sObjectName, recordToInsert, dontGetLatest) {
        var $defer = $q.defer();

        // Guard against inputs.
        if (!angular.isString(sObjectName)) {
          $defer.reject('An sObject name is required to perform insert.');
          return $defer.promise;
        }

        // Find the right REST endpoint for the sObject.
        var sObjectEndpoint = sobjectEndpoints[sObjectName];
        if (angular.isUndefined(sObjectEndpoint)) {
          sObjectEndpoint = this.model(sObjectName);
          sobjectEndpoints[sObjectName] = sObjectEndpoint;
        }

        // Insert the new record.
        return sObjectEndpoint.post(recordToInsert).then(function(response) {
          if (response.success) {
            $log.info('ngForce: Created new ' + sObjectName + ' record:', response);
            $defer.resolve(response);
            if (dontGetLatest) {
              return $defer.promise;
            }
            // Get the new record's fields.
            return sObjectEndpoint.get(response.id).then(function(newRecord) {
              $log.info('ngForce: Inserted:', newRecord);
              return newRecord;
            });
          } else {
            $defer.reject("Insert failed: [" +
              response.errors + "] Full response: " + response);
          }
          return $defer.promise;
        });
      },
      update: function(sObjectName, recordToUpdate, dontGetLatest) {
        var $defer = $q.defer();

        // Guard against inputs.
        if (!angular.isString(sObjectName)) {
          $defer.reject('An sObject name is required to perform an insert.');
          return $defer.promise;
        }

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
        var propsToIgnore = ['Id', 'LastReferencedDate', 'LastModifiedById',
          'LastModifiedDate', 'LastViewedDate', 'SystemModstamp',
          'CreatedById', 'CreatedDate', 'IsDeleted'
        ];
        for (var i = 0; i < propsToIgnore.length; i++) {
          var p = propsToIgnore[i];
          delete recordToUpdate[p];
        }

        // Update the record.
        return recordEndpoint.patch(recordToUpdate).then(function(response) {
          $log.info('ngForce: Patched ' + sObjectName + ' record:', recordToUpdate);
          if (dontGetLatest) {
            $defer.resolve('Patch successful!');
            return $defer.promise;
          }
          // Get the new record's fields.
          return recordEndpoint.get().then(function(newRecord) {
            $log.info('ngForce: Updated ' + sObjectName + ' record:', response);
            return newRecord;
          });
        });
      },
      delete: function(sObjectName, recordToDelete) {
        var $defer = $q.defer();

        // Guard against inputs.
        if (!angular.isString(sObjectName)) {
          $defer.reject('An sObject name is required to perform an insert.');
          return $defer.promise;
        }

        var recordId = recordToDelete.id || recordToDelete.Id;
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

        // Delete the record.
        return recordEndpoint.remove().then(function(response, err) {
          $log.info('ngForce: Deleted ' + sObjectName + ' record:', recordId);
          $defer.resolve('Delete successful!');
          return $defer.promise;
        });
      }
    };
    return sfRest;
  }])
  .provider('sfrquery', [function($q, $rootScope, Restangular){
    //provide a setter for the api version
    var apiVersion = 'v29.0';
    this.setApiVersion = function(newVersion) {
      apiVersion = newVersion;
    };

    var sfrquery = Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setDefaultHttpFields({
        cache: false
      });
      RestangularConfigurer.setBaseUrl('/services/data/'+ apiVersion +'/');
      RestangularConfigurer.setDefaultHeaders({
        'Authorization': 'Bearer ' + window.apiSid
      });
      RestangularConfigurer.setResponseExtractor(function(data) {
        return data.records;
      });
    }).setRestangularFields({
      id: "Id",
      selfLink: 'attributes.url'
    }).all('query');

    sfrquery.query = function(query, cacheEnabled) {
      cacheEnabled = typeof cacheEnabled !== 'undefined' ? cacheEnabled : false;
      return sfrquery.withHttpConfig({
        cache: cacheEnabled
      }).getList({
        q: query
      });
    };

    sfrquery.logAndReturnFromPromise = function(results) {
      return results;
    };

    sfrquery.queryAll = function(query, cacheEnabled) {
      // default to Cache True for query all situations.
      cacheEnabled = typeof cacheEnabled !== 'undefined' ? cacheEnabled : true;
      return sfrquery.withHttpConfig({
        cache: cacheEnabled
      }).getList({
        q: query
      }).then(function(results) {
        var $defer = $q.defer();
        var data = results; //because salesforce wraps them in a prop.
        var recordsPerPage = results.length; //This is the # of records returned by SF by default, on a per "page" ie, call basis.
        if (results.totalSize >= recordsPerPage && results.nextRecordsUrl) { // well, shoot. we've got a lot more rows of data.
          $log.info('Executing QueryMore loop; Record count is: ', results.totalSize);
          var nextUrl = results.nextRecordsUrl.split('/');
          nextUrl = nextUrl[nextUrl.length - 1];
          promises = []; // create an empty array to hold defered / promises objects
          for (var i = recordsPerPage; i <= results.totalSize; i += recordsPerPage) {
            nextUrl = nextUrl.replace(/\d+$/, i);
            //push the defered object (the promise) onto the array of promises
            promises.push(sfrquery.withHttpConfig({
              cache: cacheEnabled
            }).customGETLIST(nextUrl).then(sfrquery.logAndReturnFromPromise));
          }
          //when ALL of the promises are completed then run this block:
          $q.all(promises).then(function(additionalData) {
            $log.info('All promises completed successfully');
            var toAdd = _.flatten(additionalData);
            data = data.concat(toAdd);
            $defer.resolve(data);
          }, function(err) {
            $log.error('One or more queryAll promises failed');
            $defer.reject('One or more queryAll promises failed');
          });
        } else { // in case we have less than 1000 records.
          $defer.resolve(data);
        }
        return $defer.promise;
      });
    };

    return sfrquery;
  }])
  .provider('sfranalytics', [function($q, $rootScope, Restangular){
    //provide a setter for the api version
    var apiVersion = 'v29.0';
    this.setApiVersion = function(newVersion) {
      apiVersion = newVersion;
    };

    var analytics = Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/services/data/'+ apiVersion +'/analytics/');
      RestangularConfigurer.setDefaultHeaders({
        'Authorization': 'Bearer ' + window.apiSid
      });
    }).setRestangularFields({
      id: "Id"
    }).all('reports');

    return analytics;
  }])
  .provider('sfTemplate', [function($q, $http, $templateCache, $log){
    var scriptPatternBlacklist = [
      '/faces/a4j/g/3_3_3.Finalorg.ajax4jsf.javascript.AjaxScript',
      '/static/111213/js/perf/stub.js'
    ];

    this.setScriptPatternBlacklist = function(newScriptPatternBlacklist) {
      scriptPatternBlacklist = newScriptPatternBlacklist;
    };

    this.$getScriptPatternBlacklist = function(){
      return scriptPatternBlacklist;
    }

    // Salesforce injects scripts into all Visualforce pages.
    //   e.g.:
    //   /faces/a4j/g/3_3_3.Finalorg.ajax4jsf.javascript.AjaxScript?rel=1392581006000
    //   /static/111213/js/perf/stub.js
    // Because we can't disable this, we strip them out before rendering them.
    //   If we don't, the browser will take ~250ms to fetch them before
    //   the template is rendered.
    var escapeRegexp = function(s) {
      return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };
    var buildScriptRegex = function(scriptNames) {
      // Script names may use RexExp-reserved characters. Escape them.
      var scriptNamesEscaped = _.map(scriptNames, escapeRegexp);
      // Wrap in ".*" to match any part of script name.
      var scriptNamePatterns = _.map(scriptNamesEscaped, function(s) {
        return '.*' + s + '.*?';
      });
      // Change scripts to Regex pattern options syntax.
      //   e.g. [a, b] -> "(a|b)"
      var scriptNameOptions = "(" + scriptNamePatterns.join('|') + ")";
      var scriptTagPattern = '<script src="' + scriptNameOptions + '"><\/script>';
      var scriptTagRegex = new RegExp(scriptTagPattern, 'gi');
      return scriptTagRegex;
    };
    var stripScriptTags = function(htmlTemplate) {
      var badScriptRegex = buildScriptRegex(scriptPatternBlacklist);
      var cleanedHtmlTemplate = htmlTemplate.replace(badScriptRegex, '');
      // $log.log('ngForce: Cleaned template:', cleanedHtmlTemplate);
      return cleanedHtmlTemplate;
    };

    // The vfTemplate module is responsible for getting
    //   useable HTML templates from Salesforce.
    var sfTemplate = {
      fromVf: function(url) {
        var pTemplate = $http
          .get(url, {
            cache: $templateCache
          })
          .then(function(response) {
            // $log.log('ngForce: Fetched VF template:', response);
            return response.data;
          })
          .then(stripScriptTags);
        return pTemplate;
      }
    };
    return sfTemplate;
  }]);

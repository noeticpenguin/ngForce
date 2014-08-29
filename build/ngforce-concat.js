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
 *   access via promise-based asyncronous Visualforce Remoting, and the Rest Api
 *
 * This module requires Three external modules:
 *  1. safeApply: This handles wrapping calls to salesforce into the angular
 *    event loop
 *  2. Restangular: a library for handling rest based http calls.
 *  3. LoDash: a utility belt of useful functions for javascript.
 *
 */
angular.module('ngForce', [
  'Scope.safeApply',
  'restangular',
  'multipart'
]);;/*
 * ngForce - a visualForce remoting based Angular.js service for developing
 * Angular apps within Visualforce.
 *
 * Copyright (c)2013, Kevin Pooorman & Alex Berg
 * License: MIT
 * 
 * We are using Restangular, which uses the following functions to encode URI.
 * This was copy-pasted directly from Restangular, in the `Path` object,
 * which is used in the `urlCreatorFactory`.
 *
 * We lift this from Restangular for use with the sfrBackend module.
 * 
 */
angular.module('ngForce').factory('encodeUriQuery', function () {
  function sortedKeys(obj) {
    var keys = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    return keys.sort();
  }
  function forEachSorted(obj, iterator, context) {
    var keys = sortedKeys(obj);
    for (var i = 0; i < keys.length; i++) {
      iterator.call(context, obj[keys[i]], keys[i]);
    }
    return keys;
  }
  function encodeUriQuery(val, pctEncodeSpaces) {
    return encodeURIComponent(val).replace(/%40/gi, '@').replace(/%3A/gi, ':').replace(/%24/g, '$').replace(/%2C/gi, ',').replace(/%20/g, pctEncodeSpaces ? '%20' : '+');
  }
  return encodeUriQuery;
});;/*
 * Introducing 'multipart'
 * -----------------------
 *
 * A module that helps build a multipart HTTP request body consisting of
 * binary and/or non-binary parts.
 *
 * The resulting body can be returned as an ArrayBuffer via req.getBuffer(),
 * or as a string via req.toString().
 *
 * Usage:
 *  var req = new MultipartRequest('my_boundary');
 *
 *  var part1 = new RequestPart();
 *  part1.addHeader('My-Header', 'some value');
 *  part1.addHeader('My-Other-Header', 'some other value');
 *  part1.setBody({ Title: "My Title" });
 *  req.addPart(part1);
 *
 *  var part2 = new RequestPart();
 *  part2.addHeader('Content-Type', 'application/octet-stream');
 *  part2.setBody(<ARRAY_BUFFER>);
 *  req.addPart(part2);
 *
 *  var buffer = req.getBuffer();
 *
 * @author  https://github.com/lukemcfarlane
 * @date    July 2014
 */
angular.module('multipart', []);

/**
 * Build a part of a MultipartRequest that can contain any number of headers
 * and a body. The body can be either of the following types:
 *  - ArrayBuffer (binary data)
 *  - Object (JSON data)
 *  - String
 *
 * The resulting request part can be returned either as an ArrayBuffer (getBuffer()), or
 * as a string (toString());
 */
angular.module('multipart').service('RequestPart', function() {
    function RequestPart() {
        this.headers = [];
    }

    RequestPart.prototype.setBody = function(body) {
        this.body = body;
        switch (toString.call(body)) {
            case '[object ArrayBuffer]':
                this.bodyType = 'arraybuffer';
                break;
            case '[object String]':
                this.bodyType = 'string';
                break;
            case '[object Object]':
                this.bodyType = 'json';
                break;
            default:
                throw Error('Unsupported multipart body type: ' + toString.call(body));
        }
    };

    RequestPart.prototype.addHeader = function(name, value) {
        this.headers.push({
            name: name,
            value: value
        });
    };

    RequestPart.prototype.getRawHeaders = function() {
        var rawHeadersArr = [];
        for (var i = 0; i < this.headers.length; i++) {
            var h = this.headers[i];
            rawHeadersArr.push(h.name + ': ' + h.value);
        }
        return rawHeadersArr.join('\n');
    };

    RequestPart.prototype.getBuffer = function() {
        var bufferArr = [];
        var rawHeaders = this.getRawHeaders();
        bufferArr.push((new StringView(rawHeaders)).buffer);
        bufferArr.push((new StringView('\n\n')).buffer);
        if (this.bodyType === 'arraybuffer') {
            bufferArr.push(this.body);
        } else if (this.bodyType === 'string') {
            bufferArr.push((new StringView(this.body)).buffer);
        } else if (this.bodyType === 'json') {
            var jsonStr = JSON.stringify(this.body);
            bufferArr.push((new StringView(jsonStr)).buffer);
        }
        return joinBuffers(bufferArr);
    };

    RequestPart.prototype.toString = function() {
        return (new StringView(this.getBuffer())).toString();
    };

    function joinBuffers(arrayBuffers) {
        var lengthSum = 0;
        for (var i = 0; i < arrayBuffers.length; i++) {
            lengthSum += arrayBuffers[i].byteLength;
        }

        var joined = new Uint8Array(lengthSum);

        var offset = 0;
        for (var i = 0; i < arrayBuffers.length; i++) {
            var ab = arrayBuffers[i];
            joined.set(new Uint8Array(ab), offset);
            offset += ab.byteLength;
        }

        return joined.buffer;
    }

    return RequestPart;
});

/**
 * Build a multipart request that consists of one or more request parts.
 *
 * The resulting multipart request body can be returned either as an
 * ArrayBuffer (getBuffer()), or as a string (toString());
 */
angular.module('multipart').service('MultipartRequest', ['RequestPart',
    function(RequestPart) {
        function MultipartRequest(boundaryStr) {
            this.boundaryStr = boundaryStr;
            this.parts = [];
        }

        MultipartRequest.prototype.addPart = function(part) {
            this.parts.push(part);
        };

        MultipartRequest.prototype.getBuffer = function() {
            var bufferArr = [];
            bufferArr.push((new StringView('--' + this.boundaryStr + '\n')).buffer);
            for (var i = 0; i < this.parts.length; i++) {
                bufferArr.push(this.parts[i].getBuffer());
                bufferArr.push((new StringView('\n\n')).buffer);
                if (i !== this.parts.length - 1) { // if not the last part
                    bufferArr.push((new StringView('--' + this.boundaryStr + '\n')).buffer);
                }
            }
            bufferArr.push((new StringView('--' + this.boundaryStr + '--')).buffer);
            return joinBuffers(bufferArr);
        };

        MultipartRequest.prototype.toString = function() {
            return (new StringView(this.getBuffer())).toString();
        };

        function joinBuffers(arrayBuffers) {
            var lengthSum = 0;
            for (var i = 0; i < arrayBuffers.length; i++) {
                lengthSum += arrayBuffers[i].byteLength;
            }

            var joined = new Uint8Array(lengthSum);

            var offset = 0;
            for (var i = 0; i < arrayBuffers.length; i++) {
                var ab = arrayBuffers[i];
                joined.set(new Uint8Array(ab), offset);
                offset += ab.byteLength;
            }

            return joined.buffer;
        }

        return MultipartRequest;
    }
]);;/*
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
);;/*
 * ngForce - a visualForce remoting based Angular.js service for developing
 * Angular apps within Visualforce.
 *
 * Copyright (c)2013, Kevin Pooorman.
 * License: MIT
 *
 *
 * Salesforce injects scripts into all Visualforce pages.
 *   e.g.:
 *   /faces/a4j/g/3_3_3.Finalorg.ajax4jsf.javascript.AjaxScript?rel=1392581006000
 *   /static/111213/js/perf/stub.js
 * Because we can't disable this, we strip them out before rendering them.
 *   If we don't, the browser will take ~250ms to fetch them before
 *   the template is rendered.
 *
 */
angular.module('ngForce')
	.provider('sfTemplate',
		function() {
			// Add substrings which are unique to the script tags you wish to block.
			// Note: Regex support would be nice. The problem is that JS files have `.`
			//   as part of the file path, which is symbol reserved by Regex.
			// 
			// Script tags in the retrieved file that match these symbols will be
			// stripped from the template.
			var scriptSymbolBlacklist = [
				'.ajax4jsf.javascript.AjaxScript',
				'/js/perf/stub.js',
				'/sfdc/JiffyStubs.js'
			];
			/**
			 * an app.js config block enabled function for custom setting
			 * the blacklist of scripts to be removed
			 * @param {Array} newBlacklist Array of symbols to be blacklisted.
			 */
			this.setScriptSymbolBlacklist = function(newBlacklist) {
				if (angular.isArray(newBlacklist) && newBlacklist.length > 0) {
					scriptSymbolBlacklist = newBlacklist;
				} else {
					throw new Error('newBlacklist must be an array!');
				}
			};
			this.$get = function($q, $http, $templateCache, $log) {
				/**
				 * escape Regex special characters in the input string.
				 * @param  {[type]} s [description]
				 * @return {[type]}   [description]
				 */
				var escapeRegexp = function(s) {
					return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
				};
				/**
				 * generates a regex with the blacklisted tokens
				 * @param  {Array} scriptNames Blacklist
				 * @return {Regex}             Regex expression.
				 */
				var buildScriptRegex = function(scriptNames) {
					// Script names may use RexExp-reserved characters. Escape them.
					var scriptNamesEscaped = _.map(scriptNames, escapeRegexp);
					// Wrap in ".*" to match any part of script name.
					var scriptNamePatterns = _.map(scriptNamesEscaped, function(s) {
						return '.*' + s + '.*?';
					});
					// Change scripts to Regex pattern options syntax.
					//   e.g. [a, b] -> "(a|b)"
					var scriptNameOptions = '(' + scriptNamePatterns.join('|') + ')';
					var scriptTagPattern = '<script src="' + scriptNameOptions + '"></script>';
					var scriptTagRegex = new RegExp(scriptTagPattern, 'gi');
					return scriptTagRegex;
				};
				/**
				 * Strip out script tags from template
				 * @param  {String} htmlTemplate html string of template to have script tags parsed out.
				 * @return {String}              Html Template
				 */
				var stripScriptTags = function(htmlTemplate) {
					var badScriptRegex = buildScriptRegex(scriptSymbolBlacklist);
					var cleanedHtmlTemplate = htmlTemplate.replace(badScriptRegex, '');
					// $log.debug('ngForce: Cleaned template:', cleanedHtmlTemplate);
					return cleanedHtmlTemplate;
				};
				// The sfTemplate module is responsible for getting
				// useable HTML templates from Salesforce.
				/**
				 * Object is the functional part of this module
				 * it accepts a url, and returns a $templatCache'd template
				 * that's been stripped of extraneous scripts
				 * @type {Object}
				 */
				var sfTemplate = {
					fromVf: function(url) {
						var pTemplate = $http.get(url, {
							cache: $templateCache
						}).then(function(response) {
							// $log.debug('ngForce: Fetched VF template:', response);
							return response.data;
						}).then(stripScriptTags);
						return pTemplate;
					}
				};
				return sfTemplate;
			};
		}
);;/*
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
]);;/*
 * ngForce - a visualForce remoting based Angular.js service for developing
 * Angular apps within Visualforce.
 *
 * Copyright (c)2013, Kevin Pooorman & Alex Berg
 * License: MIT
 *
 * This is the least developed ngForce module.
 * It provides access to reports.
 * 
 */

/* global angular */
'use strict';

angular.module('ngForce').factory('sfranalytics', [
  '$q',
  '$rootScope',
  'Restangular',
  function ($q, $rootScope, Restangular) {

    // private functions and variables
    var _baseUrl = '/services/data/v29.0/analytics/';
    var _additionalHeaders = {
      'Authorization': 'Bearer ' + window.apiSid
    };

    var _analytics = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl(_baseUrl);
        RestangularConfigurer.setDefaultHeaders(_additionalHeaders);
      }).setRestangularFields({ id: 'Id' });


    // public methods and variables
    return {
      
      /* return the raw Restangular object pointing to /reports */
      analytics: function() {
        return _analytics.all('reports');
      },

      /* scope the reports API to sfranalytics.reports */
      reports: {

        /* Returns report metadata given an ID */
        metadata: function(reportId) {

          return _analytics.one('reports', reportId).get('metadata');

        },

        /* 
         * Runs a report with the given ID
         * the config object contains filtering arguments, boolean async,
         * and boolean includeDetails
        */
        run: function(reportId, config) {

          // make sure we have a config object to work with
          if ( typeof config !== 'object' ) { config = {}; }

          // no async support right now
          if ( config.async === true ) {
            throw 'Asnynchronous report runs are not supported at this time';
          }

          // set any query params for the report url
          var queryParams = {};
          if ( config.includeDetails === true || config.includeDetails === false ) {
            queryParams.includeDetails = config.includeDetails;
          }

          // check to see if we're doing on demand filtering
          var ondemandFiltering = ( config.reportFilters && config.reportFilters.length > 0 );

          if ( ondemandFiltering === true ) {

            // in the case of ondemandFiltering we need to make a call beforehand to
            // get the initial reportMetadata object so we're going to need setup our 
            // own promise with $q.defer() (is this right???).
            var deferred = $q.defer();

            // retrieve the reportMetadata object from the overall report metadata, we're going to
            // insert the filters in the config object and then post reportMetadata back to the reports API
            this.metadata(reportId).then(function(response) {

              var metadata = response.reportMetadata;

              if ( typeof config.reportBooleanFilter === 'string' || config.reportBooleanFilter === null ) {
                // overwrite the existing reportBooleanFilter with what's in the config object
                metadata.reportBooleanFilter = config.reportBooleanFilter;
              }

              // (checking to see if a variable is an array is funky)
              if ( Object.prototype.toString.call( config.reportFilters ) === '[object Array]' ) {
                // overwrite the existing reportFilters with what's in the config object
                metadata.reportFilters = config.reportFilters;
              }

              // post the filtering critiera and any query params, use our deferred object to proxy
              // back the response or error
              _analytics.one('reports').post(reportId, { reportMetadata: metadata }, queryParams).then(function(response) {
                deferred.resolve(response);
              }, function(errorResponse) {
                deferred.reject(errorResponse);
              });

            });
            
            return deferred.promise;

          } else {

            // no ondemand filtering, just run the report with any query params
            return _analytics.one('reports', reportId).get(queryParams);
          
          }

        }        

      },

      /* 
       * scope the dashboard API to sfranalytics.dashboard
      */
      dashboard: {
        /* dashboard API methods go here */
      }

    
    };
    
  }
]);;/*
 * ngForce - an Angular.js service for developing
 * Angular apps within Visualforce.
 *
 * Copyright (c)2013, Kevin Pooorman & Alex Berg
 * License: MIT
 * 
 * 
 */
angular.module('ngForce').factory('sfrBackend', [
  '$q',
  '$rootScope',
  '$log',
  '$httpBackend',
  'encodeUriQuery',
  function ($q, $rootScope, $log, $httpBackend, encodeUriQuery) {
    // Note: This function is identical to the one in the `sfTemplate` service.
    var escapeRegexp = function (s) {
      return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };
    var sfrBackend = {
        whenGetPage: function (pageName, responsePage) {
          var _pageName = pageName;
          // Ensure pageName is prefixed with "/page/"
          if (_pageName.indexOf('/apex/') == -1) {
            _pageName = '/apex/' + _pageName;
          }
          var escapedPageName = escapeRegexp(_pageName);
          $httpBackend.whenGET(new RegExp(escapedPageName, 'i')).respond(responsePage);
        },
        whenQuery: function (sObjectName, resRecords, soqlClauses) {
          // Guards
          // We want arrays, but will handle receiving single items.
          var _soqlClauses = angular.isString(soqlClauses) ? [soqlClauses] : soqlClauses;
          var _resRecords = !angular.isArray(resRecords) ? [resRecords] : resRecords;
          var encodedSoqlRegex = 'query.*FROM\\++' + sObjectName;
          if (typeof _soqlClauses != 'undefined' && _soqlClauses !== null) {
            // Encode clauses using the same encoding as Restangular, which we use.
            var encodedSoqlClauses = _.chain(_soqlClauses).map(function (value, key) {
                return encodeUriQuery(value);
              }).foldl(function (memo, value) {
                return memo += value;
              }).value();
            // The URI encoding uses RegExp characters, such as `+` and `(`. Escape them.
            encodedSoqlRegex += '\\++WHERE.*' + escapeRegexp(encodedSoqlClauses);
          }
          $httpBackend.whenGET(new RegExp(encodedSoqlRegex, 'i')).respond(200, {
            'totalSize': _resRecords.length,
            'done': true,
            'records': _resRecords
          });
        },
        expectQuery: function (sObjectName, resRecords, soqlClauses) {
          // Guards
          // We want arrays, but will handle receiving single items.
          var _soqlClauses = angular.isString(soqlClauses) ? [soqlClauses] : soqlClauses;
          var _resRecords = !angular.isArray(resRecords) ? [resRecords] : resRecords;
          var encodedSoqlRegex = 'query.*FROM\\++' + sObjectName;
          if (typeof _soqlClauses != 'undefined' && _soqlClauses !== null) {
            // Encode clauses using the same encoding as Restangular, which we use.
            var encodedSoqlClauses = _.chain(_soqlClauses).map(function (value, key) {
                return encodeUriQuery(value);
              }).foldl(function (memo, value) {
                return memo += value;
              }).value();
            // The URI encoding uses RegExp characters, such as `+` and `(`. Escape them.
            encodedSoqlRegex += '\\++WHERE.*' + escapeRegexp(encodedSoqlClauses);
          }
          $httpBackend.expectGET(new RegExp(encodedSoqlRegex, 'i')).respond(200, {
            'totalSize': _resRecords.length,
            'done': true,
            'records': _resRecords
          });
        },
        expectInsert: function (sObjectName, resRecords, getLatest) {
          // We want arrays, but will handle receiving single items.
          var _resRecords = !angular.isArray(resRecords) ? [resRecords] : resRecords;
          var _getLatest = getLatest || true;
          // Default to getLatest
          angular.forEach(_resRecords, function (resRecord, key) {
            $httpBackend.expectPOST(new RegExp(sObjectName, 'i')).respond(201, {
              'id': resRecord.Id,
              'success': true,
              'errors': []
            });
            if (!_getLatest) {
              $httpBackend.expectGET(new RegExp(sObjectName + '/' + resRecord.Id, 'i')).respond(200, resRecord);
            }
          });
        },
        expectDelete: function (sObjectName, recordIds) {
          // We want arrays, but will handle receiving single items or nothing.
          recordIds = recordIds || '';
          var _recordIds = !angular.isArray(recordIds) ? [recordIds] : recordIds;
          angular.forEach(_recordIds, function (recordId) {
            $httpBackend.expectDELETE(new RegExp(sObjectName + '/' + recordId, 'i')).respond(201, {});
          });
        }
      };
    return sfrBackend;
  }
]);;/**
 * The sfrfile service allows binary data to be uploaded via the Salesforce REST API.
 *
 * Please see the following documentation for more information:
 * http://www.salesforce.com/us/developer/docs/api_rest/Content/dome_sobject_insert_update_blob.htm
 */
angular.module('ngForce').factory('sfrfile', function($q, $rootScope, $log, Restangular, MultipartRequest, RequestPart) {
    var sfrfile = Restangular.withConfig(function(RestangularConfigurer) {
        RestangularConfigurer.setDefaultHttpFields({
            cache: false,
            transformRequest: function(data) {
                return data;
            }
        });
        RestangularConfigurer.setBaseUrl('/services/data/v29.0/sobjects');
        RestangularConfigurer.setDefaultHeaders({
            'Authorization': 'Bearer ' + window.apiSid
        });
    }).setRestangularFields({
        id: "Id",
        selfLink: 'attributes.url'
    });

    /**
     * Insert an SObject with binary data.
     *
     * @param  sObjectName  'Document', 'Attachment', or 'ContentVersion'
     * @param  sObjectData  Object containing sObject fields and values
     * @param  filename     File name string
     * @param  fileBuffer   ArrayBuffer to be included in binary part of request
     */
    sfrfile.insert = function(sObjectName, sObjectData, filename, fileBuffer) {
        SObjectType = {
            'Document': {
                jsonPartName: 'entity_document',
                binaryPartName: 'Body'
            },
            'Attachment': {
                jsonPartName: 'entity_attachment',
                binaryPartName: 'Body'
            },
            'ContentVersion': {
                jsonPartName: 'entity_content',
                binaryPartName: 'VersionData'
            }
        };

        var mySObjectType = SObjectType[sObjectName];
        if (typeof mySObjectType === undefined) {
            throw new Error('Upload not supported for SObject type \'' + sObjectName + '\'');
        }

        var binaryNameAttr;
        var boundaryStr = 'boundary_string';
        var req = new MultipartRequest(boundaryStr);

        var sobjectDataPart = new RequestPart();
        sobjectDataPart.addHeader('Content-Disposition', 'form-data; name="' + mySObjectType.jsonPartName + '";');
        sobjectDataPart.addHeader('Content-Type', 'application/json');
        sobjectDataPart.setBody(sObjectData);
        req.addPart(sobjectDataPart);

        var filePart = new RequestPart();
        filePart.addHeader('Content-Type', 'application/octet-stream');
        filePart.addHeader('Content-Disposition', 'form-data; name="' + mySObjectType.binaryPartName + '"; filename="' + filename + '"');
        filePart.setBody(fileBuffer);
        req.addPart(filePart);

        var bufferView = (new Uint8Array(req.getBuffer()));

        return sfrfile
            .all(sObjectName)
            .post(
                bufferView,
                null, {
                    'Content-Type': 'multipart/form-data; boundary="' + boundaryStr + '"'
                })
            .then(function(response) {
                return response;
            });
    };
    return sfrfile;
});
;/*
 * ngForce - a visualForce remoting based Angular.js service for developing
 * Angular apps within Visualforce.
 *
 * Copyright (c)2013, Kevin Pooorman.
 * License: MIT
 *
 * SfQuery is the main query interface for gathering Salesforce data.
 * Since Salesforce's rest API is only "restful" it has it's own 
 * dedicated query endpoint rather than query endpoints for each
 * object. 
 */
angular.module('ngForce').factory('sfrquery', [
  '$q',
  '$rootScope',
  '$log',
  'Restangular',
  'encodeUriQuery',
  function ($q, $rootScope, $log, Restangular, encodeUriQuery) {
    // Custom configure the restangular setup for this
    var sfrquery = Restangular.withConfig(function (RestangularConfigurer) {
        //These get passed through to the standard Angular $http 
        RestangularConfigurer.setDefaultHttpFields({ cache: false });
        // Establish our base url.
        RestangularConfigurer.setBaseUrl('/services/data/v30.0/');
        // and set our authorization header.
        RestangularConfigurer.setDefaultHeaders({ 'Authorization': 'Bearer ' + window.apiSid });  // With the SF "query" endpoint, it may not return the whole set
                                                                                                  //   of requested records. In this case, it will send one page of
                                                                                                  //   records, the total number of records, and a URL we can use to
                                                                                                  //   get the remaining pages of records.
                                                                                                  // Therefore, we can not use an extractor, as it will not let us
                                                                                                  //   access the "totalSize" and "nextRecordsUrl" attributes, but
                                                                                                  //   only give us the contents of the "records" attributes.
                                                                                                  // RestangularConfigurer.setResponseExtractor(function(response) {
                                                                                                  // return response.records;
                                                                                                  // });
      }).setRestangularFields({
        id: 'Id',
        selfLink: 'attributes.url'
      }).oneUrl('query', '/services/data/v30.0/query');
    /**
		 * Make a rest query to Salesforce
		 * @param  {String} query        Query String -- fully qualified SOQL string.
		 * @param  {Boolean} cacheEnabled Should we cache the response?
		 * @return {Array}              Array of records.
		 */
    sfrquery.query = function (query, cacheEnabled) {
      cacheEnabled = typeof cacheEnabled !== 'undefined' ? cacheEnabled : false;
      return sfrquery.withHttpConfig({ cache: cacheEnabled }).get({ q: query }).then(function (response) {
        return response.records;
      });
    };
    /**
		 * queryAll recursively calls through a series of salesforce Rest calls to retrieve
		 * all the rows resulting from an initial query.
		 * @param  {String} queryStringOrQueryLocator Either the query string -- on initial call, or the query locator
		 * @param  {Boolean} cacheEnabled             True - we use cache, false - no cache for you.
		 * @param  {Deferred} deferred                Deferred object - null on initial call
		 * @param  {Array} results                    Array of rows returned by all completed calls. Null on inital call
		 * @return {Promise}                          Returns a Promise!
		 */
    sfrquery.queryAll = function (queryStringOrQueryLocator, cacheEnabled, deferred, results) {
      // Setup the 3 optional params - Default to true for caching
      if (angular.isUndefined(cacheEnabled)) {
        cacheEnabled = true;
      }
      // On initial call, this recursive function will not be called with a results array, create it.
      if (angular.isUndefined(results)) {
        results = [];
      }
      // On the initial call, this recursive function will not have a deferred object, create it here.
      if (angular.isUndefined(deferred)) {
        deferred = $q.defer();
      }
      // On initial call, this method will have a query string, not a query locator. 
      // In those situations, we need to pre-pend "?q=" to the querystring. 
      // We determine whether or not to do this, by inspecting the first six characters
      // We *expect* that "Select" is the first word of a queryAll query string.
      if (queryStringOrQueryLocator.trim().substring(0, 6).toLowerCase() === 'select') {
        queryStringOrQueryLocator = '?q=' + encodeUriQuery(queryStringOrQueryLocator);
      }
      // Here starts the functional body of the method.
      sfrquery.withHttpConfig({ cache: cacheEnabled }).customGET(queryStringOrQueryLocator).then(function (data) {
        // Add to the results array. Don't try sorting or unique.
        results = results.concat(data.records);
        // Inspect the returned data, looking to see if we're "done" i.e.: we've recieved all the pages
        // of data. 
        if (!data.done) {
          // If we're not done, recursively call this method with the query locator returned by the previous call.
          // Making sure to pass on our cache parameters, our deferred object and the results array.
          sfrquery.queryAll(_.last(data.nextRecordsUrl.split('/')), cacheEnabled, deferred, results);
        } else {
          // if we are done, resolve the deferred object.
          deferred.resolve(results);
          return deferred.promise;
        }
      }, function (error) {
        // any errors are handled here.
        return deferred.reject(error);
      });
      // this deferred.notify call allows us in theory to update the ui with a "we've made 5 out of 7 calls" type message.
      deferred.notify();
      // regardless, return a promise!
      return deferred.promise;
    };
    return sfrquery;
  }
]);;/*
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
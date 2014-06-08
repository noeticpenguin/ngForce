/*
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
]);
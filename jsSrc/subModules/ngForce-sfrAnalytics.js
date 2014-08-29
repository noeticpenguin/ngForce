/*
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
]);
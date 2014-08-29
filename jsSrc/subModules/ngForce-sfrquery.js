/*
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
]);
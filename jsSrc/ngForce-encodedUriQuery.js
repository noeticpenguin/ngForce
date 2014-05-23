/*
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
});
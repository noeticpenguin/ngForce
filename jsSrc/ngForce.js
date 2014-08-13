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
]);
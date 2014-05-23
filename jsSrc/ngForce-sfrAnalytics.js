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
angular.module('ngForce').factory('sfranalytics', [
  '$q',
  '$rootScope',
  'Restangular',
  function ($q, $rootScope, Restangular) {
    var analytics = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl('/services/data/v29.0/analytics/');
        RestangularConfigurer.setDefaultHeaders({ 'Authorization': 'Bearer ' + window.apiSid });
      }).setRestangularFields({ id: 'Id' }).all('reports');
    return analytics;
  }
]);
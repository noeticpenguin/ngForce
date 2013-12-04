angular.module('ngForce', [
  'Scope.safeApply',
  'restangular'
]);
angular.module('ngForce').factory('vfr', [
  '$q',
  '$rootScope',
  function ($q, $rootScope) {
    var vfRemote = {};
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
    handleResultWithPromise = function (result, event, nullok, deferred) {
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
          message: 'Null returned by RemoteAction not called with nullOk flag',
          errorCode: 'NULL_RETURN'
        });
        $rootScope.$safeApply();
      }
    };
    var standardOptions = {
        escape: false,
        timeout: 10000
      };
    vfRemote.bulkCreate = vfRemote.send('ngForceController.bulkCreate', standardOptions, false);
    vfRemote.create = vfRemote.send('ngForceController.create', standardOptions, false);
    vfRemote.clone = vfRemote.send('ngForceController.sObjectKlone', standardOptions, false);
    vfRemote.del = vfRemote.send('ngForceController.del', standardOptions, true);
    vfRemote.describe = vfRemote.send('ngForceController.describe', standardOptions, false);
    vfRemote.describeFieldSet = vfRemote.send('ngForceController.describeFieldSet', standardOptions, false);
    vfRemote.describePicklistValues = vfRemote.send('ngForceController.getPicklistValues', standardOptions, false);
    vfRemote.getObjectType = vfRemote.send('ngForceController.getObjType', standardOptions, false);
    vfRemote.getQueryResultsAsSelect2Data = vfRemote.send('ngForceController.getQueryResultsAsSelect2Data', standardOptions, false);
    vfRemote.query = vfRemote.send('ngForceController.query', {
      escape: false,
      timeout: 30000
    }, false);
    vfRemote.queryFromFieldset = vfRemote.send('ngForceController.queryFromFieldSet', {
      escape: false,
      timeout: 30000
    }, false);
    vfRemote.retrieve = vfRemote.send('ngForceController.retrieve', standardOptions, false);
    vfRemote.search = vfRemote.send('ngForceController.search', standardOptions, false);
    vfRemote.soqlFromFieldSet = vfRemote.send('ngForceController.soqlFromFieldSet', standardOptions, false);
    vfRemote.update = vfRemote.send('ngForceController.updat', standardOptions, true);
    vfRemote.upsert = vfRemote.send('ngForceController.upser', standardOptions, true);
    return vfRemote;
  }
]);
angular.module('ngForce').factory('sfr', [
  '$q',
  '$rootScope',
  'Restangular',
  function ($q, $rootScope, Restangular) {
    var sfRest = {
        model: function (modelName) {
          return Restangular.setDefaultHeaders({ 'Authorization': 'Bearer ' + window.apiSid }).setBaseUrl('/services/data/v29.0/').all(modelName);
        }
      };
    return sfRest;
  }
]);
angular.module('ngForce').factory('analytics', [
  '$q',
  '$rootScope',
  'Restangular',
  function ($q, $rootScope, Restangular) {
    var analytics = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl('/services/data/v29.0/analytics/');
        RestangularConfigurer.setDefaultHeaders({ 'Authorization': 'Bearer ' + window.apiSid });
      }).all('reports');
    return analytics;
  }
]);
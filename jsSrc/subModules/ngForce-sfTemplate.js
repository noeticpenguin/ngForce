/*
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
);
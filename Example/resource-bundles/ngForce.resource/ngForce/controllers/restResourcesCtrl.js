app.controller('restResourcesCtrl', function($scope, $rootScope, vfr, sfr, analytics) {

	psobs = sfr.model('sobjects');
	psobs.getList().then(function(x) {
		$scope.sObjects = syntaxHighlight(x.sobjects);
	});

	pAnalytics = analytics.getList();
	pAnalytics.then(function(y) {
		$scope.reports = syntaxHighlight(y);
	});

	pReport = analytics.get('00Oi0000004xV6pEAE', {
		'includeDetails': true
	}); //.syncReportRun({'includeDetails':true});
	pReport.then(function(data) {
		$scope.reportData = syntaxHighlight(data);
	});

	function syntaxHighlight(json) {
		if (typeof json != 'string') {
			json = JSON.stringify(json, undefined, 2);
		}
		json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
			var cls = 'number';
			if (/^"/.test(match)) {
				if (/:$/.test(match)) {
					cls = 'key';
				} else {
					cls = 'string';
				}
			} else if (/true|false/.test(match)) {
				cls = 'boolean';
			} else if (/null/.test(match)) {
				cls = 'null';
			}
			return '<span class="' + cls + '">' + match + '</span>';
		});
	}

});
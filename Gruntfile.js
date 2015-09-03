module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt, {
		pattern: ['grunt-*', '!grunt-template-jasmine-istanbul', 'which']
	});

	var stdMetadata = {
		apexclass: ['*'],
		apexpage: ['*'],
		staticresource: ['*'],
		customobject: ['*'],
		apextrigger: ['*'],
		apexcomponent: ['*']
	};

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		ngAnnotate: {
			options: {
				singleQuotes: true
			},
			ngForce: {
				files: [{
					expand: true,
					cwd: 'jsSrc',
					ext: '.annotated.js',
					src: ['*.js', 'subModules/*.js'],
					dest: 'buildTmp'
				}]
			},
			dependencies: {
				files: [{
					expand: true,
					ext: '.annotated.js',
					cwd: 'lib',
					src: ['*.js'],
					dest: 'buildTmp/lib'
				}],
			}
		},
		uglify: {
			options: {
				sourceMap: true,
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n' +
					'/*! visit https://noeticpenguin.github.io/ngForce for more info. */\n'
			},
			ngForce: {
				files: {
					'build/ngForce.min.js': ['buildTmp/*.annotated.js', 'buildTmp/subModules/*.annotated.js']
				}
			},
			requirements: {
				files: {
					'build/ngForce-dependencies.min.js': ['buildTmp/lib/*.annotated.js']
				}
			},
			oneFile: {
				files: {
					'build/ngForceWithDependencies.min.js': ['build/ngForce-dependencies.min.js', 'build/ngForce.min.js']
				}
			}
		},
		jasmine: {
			ngForce: {
				src: [
					'jsSrc/safeApply.js',
					'jsSrc/restangular.js',
					'jsSrc/ngForce3.js'
				],
				options: {
					// Include path for Jasmine spec files
					// Only include those ending in Spec.js
					// Specifically excluding those ending in NotReady.js
					specs: [
						'test/unit/**/*Spec.js'
					],
					version: '2.0.0',
					template: require('grunt-template-jasmine-istanbul'),
					templateOptions: {
						coverage: 'bin/coverage/coverage.json',
						report: 'bin/coverage',
						thresholds: {
							lines: 30,
							statements: 20,
							branches: 10,
							functions: 5
						}
					}
				}
			}
		},
		copy: {
			deploy: {
				files: [{
					src: 'src/**',
					dest: 'deployTmp/',
				}]
			},
		},
		clean: {
			buildTmp: ['buildTmp'],
			deployTmp: ['deployTmp']
		},
		antdeploy: {
			options: {
				version: '29.0',
				root: 'deployTmp/src/',
			},
			automated: {
				options: {
					useEnv: true,
					serverurl: 'https://test.salesforce.com' // default => https://login.salesforce.com
				},
				pkg: stdMetadata
			},
			test: {
				options: {
					serverurl: 'https://test.salesforce.com' // default => https://login.salesforce.com
				},
				pkg: stdMetadata
			},
			prod: {
				options: {
					serverurl: 'https://login.salesforce.com'
				},
				pkg: stdMetadata
			}
		},
		availabletasks: {
			tasks: {}
		},
		compress: {
			ngForce: {
				options: {
					mode: 'zip',
					archive: 'src/staticresources/ngForce.resource'
				},
				files: [{
					expand: true,
					cwd: 'build/',
					src: ['**'],
					dest: ''
				}, ]
			},
		},
		deploy: {
			test: {},
			prod: {}
		},
		prompt: {
			login: {
				options: {
					questions: [{
						config: 'antdeploy.test.options.user', // arbitray name or config for any other grunt task
						type: 'input', // list, checkbox, confirm, input, password
						message: "Enter the Deploy Username: ", // Question to ask the user, function needs to return a string,
					}, {
						config: 'antdeploy.test.options.pass', // arbitray name or config for any other grunt task
						type: 'password', // list, checkbox, confirm, input, password
						message: "Enter Password (without security token): ", // Question to ask the user, function needs to return a string,
					}, {
						config: 'antdeploy.test.options.token', // arbitray name or config for any other grunt task
						type: 'password', // list, checkbox, confirm, input, password
						message: "Enter Security Token: ", // Question to ask the user, function needs to return a string,
					}],
					then: function(ans) {
						grunt.config.merge({
							antdeploy: {
								prod: {
									options: {
										user: grunt.config.get('antdeploy.test.options.user'),
										pass: grunt.config.get('antdeploy.test.options.pass'),
										token: grunt.config.get('antdeploy.test.options.token')
									}
								}
							}
						});
						// grunt.config.set(antdeploy.prod.options.user, antdeploy.test.options.user);
						// grunt.config.set(antdeploy.prod.options.pass, antdeploy.test.options.pass);
						// grunt.config.set(antdeploy.prod.options.token, antdeploy.test.options.token);

					}
				}
			},
		},

	});

	// Default task. - Run tests
	grunt.registerTask('default', 'min');

	// Refresh the static Resource bundle.
	grunt.registerTask('refreshResources', "Refresh the staticResource.zip files", function() {
		grunt.task.run(['compress:ngForce']);
	});

	// Deploy task
	grunt.registerMultiTask('deploy', "Refreshes resources and deploys to selected env", function() {
		grunt.task.run([
			'refreshResources',
			'copy:deploy',
			'prompt:login',
			'antdeploy:' + this.target,
			'clean:deployTmp'
		]);
	});

	// run ngMin, then uglify the the source into a single ngForce.min.js file.
	grunt.registerTask('min', function() {
		grunt.task.run([
			'ngAnnotate:ngForce',
			'ngAnnotate:dependencies',
			'uglify:ngForce',
			'uglify:requirements',
			'uglify:oneFile',
			'clean:buildTmp'
		]);
	});

	// Show available tasks.
	grunt.registerTask('tasks', ['availabletasks']);

};
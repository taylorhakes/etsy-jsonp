module.exports = function(grunt) {
	grunt.initConfig({
		uglify: {
			my_target: {
				files: {
					'etsy-jsonp.min.js': ['etsy-jsonp.js']
				}
			}
		},
		jshint: {
			all: ['etsy-jsonp.js'],
			options:  {
				jshintrc: true
			}
		},
		karma: {
			unit: {
				configFile: 'karma.conf.js'
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-karma');

	grunt.registerTask('test', ['jshint', 'karma']);
	grunt.registerTask('default', ['jshint', 'karma', 'uglify']);
};


var express = require('express');
var app = express();
var spawn = require('child_process').spawn;
var fs = require('fs');
var async = require('async');

var servers = {
	github: 'git@github.com:{relative_url}.git',
	bitbucket: 'ssh://git@bitbucket.org/{relative_url}.git'
};

var mappings = JSON.parse(fs.readFileSync('mappings.json'));

mappings.forEach(function (mapping) {
	mapping.local = 'projects/' + mapping.local;
})

app.use(express.bodyParser());

function gitSpawn(args, callback, cwd) {
	var git = spawn('git', args, {stdio: 'inherit', cwd: cwd});
	git.on('exit', function (code) {
		callback(code !== 0);
	});
	return git;
}

function mergeMapping(mapping, callback) {
	fs.exists(mapping.local, function (exists) {
		(function (commandsCallback) {
			if (!exists) {     
				console.log('Creating ' + mapping.local + '...');
				gitSpawn(['init', mapping.local], function (err) {
					if (err) return callback(err);
					var gitCmds = [];
					for (var name in servers) {
						gitCmds.push(['remote', 'add', name, servers[name].replace('{relative_url}', mapping[name])]);
					}
					commandsCallback(gitCmds);
				});
			} else {
				console.log('Updating ' + mapping.local + '...');
				commandsCallback([]);
			}
		})(function (gitCmds) {
			gitCmds.push(['remote', 'update']);

			for (var name in servers) {
				gitCmds.push(['merge', name + '/master']);
			}

			for (var name in servers) {
				gitCmds.push(['push', name, 'master']);
			}

			async.eachSeries(gitCmds, function (gitArgs, eachCallback) {
				gitSpawn(gitArgs, eachCallback, mapping.local);
			}, callback);
		});
	});
}

console.log("Initializing...");
async.each(mappings, mergeMapping, function (err) {
	if (err) return console.log(err);

	function merge(source, request, getRelativePath, callback) {
		fs.writeFile('logs/' + Date.now() + '.' + source + '.json', request.body.payload);

		var relative_url = getRelativePath(JSON.parse(request.body.payload));
		var mappings = mappings.filter(function (mapping) { return mapping[source] === relative_url });

		if (mappings.length === 0) return callback("Unknown repository.");

		return mergeMapping(mappings[0], callback);
	}

	app.post('/commit/bitbucket', function (request, response) {
		merge(
			'bitbucket',
			request,
			function (payload) { return payload.repository.owner + '/' + payload.repository.name },
			function () { response.end() }
		);
	});

	app.post('/commit/github', function (request, response) {
		merge(
			'github',
			request,
			function (payload) { return payload.repository.owner.name + '/' + payload.repository.name },
			function () { response.end() }
		);
	});

	port = process.env.PORT || 5000;

	app.listen(port, function () {
		console.log('Listening on ' + port);
	});
});
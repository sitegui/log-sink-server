'use strict'

let config = require('../../config'),
	AC = require('asynconnection')

let range = {
	'min?': 'uint',
	'max?': 'uint'
}

let log = {
	origin: 'string',
	date: 'date',
	name: 'string',
	level: 'uint',
	relevance: 'uint',
	'time?': 'uint',
	'message?': 'string',
	'commit?': 'Buffer',
	'extra?': 'json'
}

let options = {
	secure: Boolean(config.socket.cert),
	ca: config.socket.cert,
	port: config.port,
	host: 'localhost'
}

/**
 * @param {string} [user='test']
 * @param {Function} done
 */
module.exports.connect = function (user, done) {
	let cntxt = new AC()

	if (typeof user === 'function') {
		done = user
		user = 'test'
	}

	// Write api
	let writeLog = {
		date: 'date',
		name: 'string',
		level: 'uint',
		relevance: 'uint',
		'time?': 'uint',
		'message?': 'string',
		'commit?': 'Buffer',
		'extra?': 'json'
	}
	cntxt.addClientMessage(1, 'log', writeLog)
	cntxt.addClientCall(1, 'log', writeLog, null)

	// Live stream api
	cntxt.addClientCall(2, 'setStream', {
		id: 'string',
		includeExtra: 'boolean',
		filter: {
			origin: 'string',
			'name?': 'string',
			'nameRegex?': 'regex',
			'level?': range,
			'relevance?': range,
			'time?': range,
			'message?': 'string',
			'messageRegex?': 'regex',
			'commit?': 'Buffer'
		}
	}, null)
	cntxt.addClientCall(3, 'unsetStream', 'string', 'boolean')
	cntxt.addClientCall(4, 'unsetAllStreams', null, null)
	cntxt.addServerMessage(1, 'stream', {
		id: 'string',
		includeExtra: 'boolean',
		log
	}, function (data) {
		this.emit('stream', data)
	})

	// Query api
	cntxt.addClientCall(5, 'query', {
		includeExtra: 'boolean',
		query: {
			origin: 'string',
			date: {
				min: 'date',
				'max?': 'date'
			},
			relevance: 'uint',
			'name?': 'string',
			'nameRegex?': 'regex',
			'level?': range,
			'time?': range,
			'message?': 'string',
			'messageRegex?': 'regex',
			'commit?': 'Buffer',
			'extra?': 'json'
		},
		limit: 'uint',
		'skip?': 'uint',
		'sort?': 'string'
	}, [log])

	// Meta api
	cntxt.addClientCall(6, 'getPermissions', null, ['string'])

	// Connect and translate to done(err, peer)
	function onerror(err) {
		done(err)
	}
	let peer = cntxt.connect(options, {
		user,
		password: ''
	}, () => {
		peer.removeListener('error', onerror)
		done(null, peer)
	})
	peer.once('error', onerror)
}
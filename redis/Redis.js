const bluebird = require('bluebird');
const redisClient = require('redis');
const winston = require('winston');

bluebird.promisifyAll(redisClient.RedisClient.prototype);
bluebird.promisifyAll(redisClient.Multi.prototype);

class Redis {
	constructor() {
		this.redis = redisClient.createClient({ db: 2 });
	}

	get db() {
		return this.redis;
	}

	start() {
		this.redis.on('error', err => { winston.error(err); })
			.on('reconnecting', () => { winston.warn('Reconnecting...'); });
	}
}

module.exports = Redis;

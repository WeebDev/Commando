const { promisifyAll } = require('tsubaki');
const redisClient = require('redis');
const winston = require('winston');

const { REDIS } = process.env;

promisifyAll(redisClient.RedisClient.prototype);
promisifyAll(redisClient.Multi.prototype);

const redis = redisClient.createClient({ host: REDIS, port: 6379 });

class Redis {
	static get db() {
		return redis;
	}

	static start() {
		redis.on('error', error => winston.error(`[REDIS]: Encountered error: \n${error}`))
			.on('reconnecting', () => winston.warn('[REDIS]: Reconnecting...'));
	}
}

module.exports = Redis;

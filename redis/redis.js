const bluebird = require('bluebird');
const redisClient = require('redis');
const winston = require('winston');

bluebird.promisifyAll(redisClient.RedisClient.prototype);
bluebird.promisifyAll(redisClient.Multi.prototype);

const redis = redisClient.createClient();

redis.on('error', err => { winston.error(err); })
	.on('reconnecting', () => { winston.warn('Reconnecting...'); });

module.exports = { redis };

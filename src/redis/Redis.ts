import * as bluebird from 'bluebird';
import * as redisClient from 'redis';
import * as winston from 'winston';

bluebird.promisifyAll(redisClient.RedisClient.prototype);
bluebird.promisifyAll(redisClient.Multi.prototype);

const redis = redisClient.createClient({ db: '2' });

export default class Redis {
	static get db(): redisClient.RedisClient {
		return redis;
	}

	public static start(): void {
		Redis.db.on('error', (err: Error) => winston.error(err.toString()))
			.on('reconnecting', () => winston.warn('Reconnecting...'));
	}
}

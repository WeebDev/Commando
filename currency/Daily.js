const Currency = require('./Currency');
const Redis = require('../redis/Redis');

const currency = new Currency();
const redis = new Redis();

const dayInMS = 24 * 60 * 60 * 1000;

module.exports = class Daily {
	static get dailyDonuts() {
		return 210;
	}

	static async received(userID) {
		const lastDaily = await redis.db.getAsync(`daily${userID}`);

		if (!lastDaily) return false;

		return Date.now() - dayInMS < lastDaily;
	}

	static async nextDaily(userID) {
		const lastDaily = await redis.db.getAsync(`daily${userID}`);
		return dayInMS - (Date.now() - lastDaily);
	}

	static receive(userID) {
		currency.addBalance(userID, Daily.dailyDonuts);
		redis.db.setAsync(`daily${userID}`, Date.now());
		redis.db.expire(`daily${userID}`, dayInMS / 1000);
	}
};

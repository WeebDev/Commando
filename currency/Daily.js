const Currency = require('./Currency');
const Redis = require('../redis/Redis');

const redis = new Redis();

const dayInMS = 24 * 60 * 60 * 1000;

module.exports = class Daily {
	static get normalPayout() {
		return 210;
	}

	static get donationPayout() {
		return 300;
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

	static receive(userID, donationID) {
		if (donationID) Currency.addBalance(donationID, Daily.donationPayout);
		else Currency.addBalance(userID, Daily.normalPayout);

		redis.db.setAsync(`daily${userID}`, Date.now());
		redis.db.expire(`daily${userID}`, dayInMS / 1000);
	}
};

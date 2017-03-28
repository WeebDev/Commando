const Currency = require('./Currency');
const Redis = require('../Redis');

const redis = new Redis();

const DAY_DURATION = 24 * 60 * 60 * 1000;

module.exports = class Daily {
	static get dailyPayout() {
		return 210;
	}

	static get dailyDonationPayout() {
		return 300;
	}

	static async received(userID) {
		const lastDaily = await redis.db.getAsync(`daily${userID}`);
		if (!lastDaily) return false;
		return Date.now() - DAY_DURATION < lastDaily;
	}

	static async nextDaily(userID) {
		const lastDaily = await redis.db.getAsync(`daily${userID}`);
		return DAY_DURATION - (Date.now() - lastDaily);
	}

	static receive(userID, donationID) {
		if (donationID) {
			Currency._changeBalance(donationID, Daily.dailyDonationPayout);
		} else {
			Currency._changeBalance(userID, Daily.dailyPayout);
		}

		redis.db.setAsync(`daily${userID}`, Date.now());
		redis.db.expire(`daily${userID}`, DAY_DURATION / 1000);
	}
};

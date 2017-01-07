const Redis = require('../redis/Redis');
const UserProfile = require('../postgreSQL/models/UserProfile');

const redis = new Redis();

setInterval(() => Currency.leaderboard(), 30 * 60 * 1000);

redis.db.hgetAsync('money', 'SLOTMACHINE').then(balance => {
	if (!balance) return redis.db.hsetAsync('money', 'SLOTMACHINE', 5000);

	return; // eslint-disable-line consistent-return
});

class Currency {
	static addBalance(user, earned) {
		redis.db.hgetAsync('money', user).then(balance => {
			balance = parseInt(balance) || 0;
			redis.db.hsetAsync('money', user, earned + parseInt(balance));
		});
	}

	static removeBalance(user, earned) {
		Currency.addBalance(user, -earned);
	}

	static async getBalance(user) {
		const money = await redis.db.hgetAsync('money', user) || 0;

		return money;
	}

	static leaderboard() {
		redis.db.hgetallAsync('money').then(balances => {
			const ids = Object.keys(balances || {});

			for (const id of ids) {
				UserProfile.findOne({ where: { userID: id } }).then(user => {
					if (!user) {
						UserProfile.create({
							userID: id,
							money: balances[id]
						});
					} else {
						user.update({ money: balances[id] });
					}
				});
			}
		});

		redis.db.setAsync('moneyleaderboardreset', Date.now());
		redis.db.expire('moneyleaderboardreset', 30 * 60 * 1000);
	}
}

module.exports = Currency;

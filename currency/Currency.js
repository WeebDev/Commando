const Redis = require('../redis/Redis');
const UserProfile = require('../postgreSQL/models/UserProfile');

const redis = new Redis();

const UPDATE_DURATION = 30 * 60 * 1000;

setInterval(() => Currency.leaderboard(), UPDATE_DURATION);

redis.db.hgetAsync('money', 'bank').then(balance => {
	if (!balance) redis.db.hsetAsync('money', 'bank', 5000);
});

class Currency {
	static _changeBalance(user, amount) {
		redis.db.hgetAsync('money', user).then(balance => {
			balance = parseInt(balance) || 0;
			redis.db.hsetAsync('money', user, amount + parseInt(balance));
		});
	}

	static changeBalance(user, amount) {
		Currency._changeBalance(user, amount);
		Currency._changeBalance('bank', -amount);
	}

	static addBalance(user, amount) {
		Currency.changeBalance(user, amount);
	}

	static removeBalance(user, amount) {
		Currency.changeBalance(user, -amount);
	}

	static async getBalance(user) {
		const money = await redis.db.hgetAsync('money', user) || 0;

		return parseInt(money);
	}

	static async leaderboard() {
		const balances = await redis.db.hgetallAsync('money') || {};
		const bankBalances = await redis.db.hgetallAsync('ledger') || {};

		const ids = Object.keys(balances || {});

		for (const id of ids) {
			const money = parseInt(balances[id] || 0);
			const balance = parseInt(bankBalances[id] || 0);
			const networth = money + balance;

			const user = await UserProfile.findOne({ where: { userID: id } });
			if (!user) {
				UserProfile.create({
					userID: id,
					money,
					balance,
					networth
				});
			} else {
				user.update({
					money,
					balance,
					networth
				});
			}
		}

		redis.db.setAsync('moneyleaderboardreset', Date.now());
		redis.db.expire('moneyleaderboardreset', UPDATE_DURATION);
	}

	static convert(amount, text = false) {
		if (isNaN(amount)) amount = parseInt(amount);
		if (!text) return `${amount.toLocaleString()} ${Math.abs(amount) === 1 ? Currency.singular : Currency.plural}`;

		return `${amount.toLocaleString()} ${Math.abs(amount) === 1 ? Currency.textSingular : Currency.textPlural}`;
	}

	static get singular() {
		return '🍩';
	}

	static get plural() {
		return '🍩s';
	}

	static get textSingular() {
		return 'donut';
	}

	static get textPlural() {
		return 'donuts';
	}
}

module.exports = Currency;

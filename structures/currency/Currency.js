const Redis = require('../Redis');
const UserProfile = require('../../models/UserProfile');

const UPDATE_DURATION = 30 * 60 * 1000;

Redis.db.hgetAsync('money', 'bank').then(async balance => {
	if (!balance) await Redis.db.hsetAsync('money', 'bank', 5000);
});

class Currency {
	static _changeBalance(user, amount) {
		Redis.db.hgetAsync('money', user).then(balance => {
			const bal = parseInt(balance) || 0;

			return Redis.db.hsetAsync('money', user, amount + parseInt(bal));
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
		const money = await Redis.db.hgetAsync('money', user) || 0;

		return parseInt(money);
	}

	static async leaderboard() {
		const balances = await Redis.db.hgetallAsync('money') || {};
		const bankBalances = await Redis.db.hgetallAsync('ledger') || {};

		const ids = Object.keys(balances || {});

		/* eslint-disable no-await-in-loop */
		for (const id of ids) {
			const money = parseInt(balances[id] || 0);
			const balance = parseInt(bankBalances[id] || 0);
			const networth = money + balance;

			const user = await UserProfile.findOne({ where: { userID: id } });
			if (!user) {
				await UserProfile.create({
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
		/* eslint-enable no-await-in-loop */

		await Redis.db.setAsync('moneyleaderboardreset', Date.now());
		setTimeout(() => Currency.leaderboard(), UPDATE_DURATION);
	}

	static convert(amount, text = false) {
		if (isNaN(amount)) amount = parseInt(amount);
		if (!text) return `${amount.toLocaleString()} ${Math.abs(amount) === 1 ? Currency.singular : Currency.plural}`;

		return `${amount.toLocaleString()} ${Math.abs(amount) === 1 ? Currency.textSingular : Currency.textPlural}`;
	}

	static get singular() {
		return '🧀';
	}

	static get plural() {
		return '🧀';
	}

	static get textSingular() {
		return 'cheese';
	}

	static get textPlural() {
		return 'cheese';
	}
}

module.exports = Currency;

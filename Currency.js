const Collection = require('discord.js').Collection;

const Redis = require('./redis/Redis');

const earnings = new Collection();
const redis = new Redis();

module.exports = class Currency {
	get collection() {
		return earnings;
	}

	addBalance(user, earned) {
		const amount = earnings.get(user) || 0;
		earnings.set(user, amount + earned);
		redis.db.getAsync(`money${user}`).then(balance => {
			if (!balance) return redis.db.setAsync(`money${user}`, earned);
			return redis.db.setAsync(`money${user}`, earned + parseInt(balance));
		});
	}

	removeBalance(user, earned) {
		this.addBalance(user, -earned);
	}

	getBalance(user) {
		return redis.db.getAsync(`money${user}`);
	}

	clear() {
		earnings.clear();
	}
};

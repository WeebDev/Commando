const Collection = require('discord.js').Collection;

const earnings = new Collection();

module.exports = class Currency {
	get earnings() {
		return earnings;
	}

	addEarning(user, amount) {
		earnings.set(user, amount);
	}

	getEarning(user) {
		return earnings.get(user);
	}

	clear() {
		earnings.clear();
	}
};

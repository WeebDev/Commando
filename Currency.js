const Redis = require('./redis/Redis');
const Money = require('./postgreSQL/models/Money');

const redis = new Redis();

setInterval(() => {
	redis.db.hgetallAsync('money').then(balances => {
		const ids = Object.keys(balances);

		for (const id of ids) {
			Money.findOne({ where: { userID: id } }).then(user => {
				if (!user) {
					Money.create({
						userID: id,
						money: balances[id]
					});
				} else {
					user.update({ money: balances[id] });
				}
			});
		}
	});
}, 60 * 60 * 1000);

module.exports = class Currency {
	addBalance(user, earned) {
		redis.db.hgetAsync('money', user).then(balance => {
			balance = parseInt(balance) || 0;
			redis.db.hsetAsync('money', user, earned + parseInt(balance));
		});
	}

	removeBalance(user, earned) {
		this.addBalance(user, -earned);
	}

	getBalance(user) {
		return redis.db.hgetAsync('money', user);
	}
};

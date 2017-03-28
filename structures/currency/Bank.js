const Currency = require('./Currency');
const Redis = require('../Redis');

const redis = new Redis();

// Rate * convert to decimal
const INTEREST_MATURE_RATE = 0.1;
const UPDATE_DURATION = 30 * 60 * 1000;
const MIN_INTEREST_RATE = 0.001;

redis.db.getAsync('bankupdate').then(update => {
	setTimeout(() => Bank.applyInterest(), Math.max(0, (new Date(update) + UPDATE_DURATION) - Date.now()));
});

class Bank {
	static changeLedger(user, amount) {
		redis.db.hgetAsync('ledger', user).then(async balance => {
			const bal = parseInt(balance) || 0;
			await redis.db.hsetAsync('ledger', user, amount + parseInt(bal));
		});
	}

	static async getBalance(user) {
		const balance = await redis.db.hgetAsync('ledger', user) || 0;
		return parseInt(balance);
	}

	static deposit(user, amount) {
		Currency.removeBalance(user, amount);
		this.changeLedger(user, amount);
	}

	static withdraw(user, amount) {
		Currency.addBalance(user, amount);
		this.changeLedger(user, -amount);
	}

	static async applyInterest() {
		const interestRate = await this.getInterestRate();

		const bankBalance = await Currency.getBalance('bank');
		const previousBankBalance = await redis.db.getAsync('lastbankbalance') || bankBalance;
		const bankBalanceDelta = (bankBalance - previousBankBalance) / previousBankBalance;

		redis.db.hgetallAsync('ledger').then(async balances => {
			if (!balances) return;

			for (const [user, balance] of Object.entries(balances)) {
				/* eslint-disable no-await-in-loop */
				await redis.db.hsetAsync('ledger', user, Math.round(balance * (interestRate + 1)));
			}
		});

		const newInterestRate = Math.max(MIN_INTEREST_RATE, interestRate + (bankBalanceDelta * -INTEREST_MATURE_RATE));
		redis.db.setAsync('interestrate', newInterestRate);
		redis.db.setAsync('lastbankbalance', bankBalance);
		redis.db.del('bankupdate');
		redis.db.setAsync('bankupdate', Date.now());
		redis.db.expire('bankupdate', UPDATE_DURATION);

		setTimeout(() => Bank.applyInterest(), UPDATE_DURATION);
	}

	static async getInterestRate() {
		const interestRate = await redis.db.getAsync('interestrate') || 0.01;
		return parseFloat(interestRate);
	}

	static async nextUpdate() {
		const lastUpdate = await redis.db.getAsync('bankupdate');
		return UPDATE_DURATION - (Date.now() - lastUpdate);
	}
}

module.exports = Bank;

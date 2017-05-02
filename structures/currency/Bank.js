const Currency = require('./Currency');
const Redis = require('../Redis');

// Rate * convert to decimal
const INTEREST_MATURE_RATE = 0.1;
const UPDATE_DURATION = 30 * 60 * 1000;
const MIN_INTEREST_RATE = 0.001;

Redis.db.getAsync('bankupdate').then(update => {
	setTimeout(() => Bank.applyInterest(), Math.max(0, (new Date(update) + UPDATE_DURATION) - Date.now()));
});

class Bank {
	static changeLedger(user, amount) {
		Redis.db.hgetAsync('ledger', user).then(async balance => {
			const bal = parseInt(balance) || 0;
			await Redis.db.hsetAsync('ledger', user, amount + parseInt(bal));
		});
	}

	static async getBalance(user) {
		const balance = await Redis.db.hgetAsync('ledger', user) || 0;

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
		const previousBankBalance = await Redis.db.getAsync('lastbankbalance') || bankBalance;
		const bankBalanceDelta = (bankBalance - previousBankBalance) / previousBankBalance;

		Redis.db.hgetallAsync('ledger').then(async balances => {
			if (!balances) return;

			/* eslint-disable no-await-in-loop */
			for (const [user, balance] of Object.entries(balances)) {
				await Redis.db.hsetAsync('ledger', user, Math.round(balance * (interestRate + 1)));
			}
			/* eslint-enable no-await-in-loop */
		});

		const newInterestRate = Math.max(MIN_INTEREST_RATE, interestRate + (bankBalanceDelta * -INTEREST_MATURE_RATE));
		await Redis.db.setAsync('interestrate', newInterestRate);
		await Redis.db.setAsync('lastbankbalance', bankBalance);
		await Redis.db.setAsync('bankupdate', Date.now());

		setTimeout(() => Bank.applyInterest(), UPDATE_DURATION);
	}

	static async getInterestRate() {
		const interestRate = await Redis.db.getAsync('interestrate') || 0.01;

		return parseFloat(interestRate);
	}

	static async nextUpdate() {
		const lastUpdate = await Redis.db.getAsync('bankupdate');

		return UPDATE_DURATION - (Date.now() - lastUpdate);
	}
}

module.exports = Bank;

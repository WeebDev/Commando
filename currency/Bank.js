const Currency = require('./Currency');
const Redis = require('../redis/Redis');

const redis = new Redis();

setInterval(() => Bank.applyInterest, 60 * 60 * 1000);

// rate * convert to decimal
const INTEREST_MATURE_RATE = 0.0001 * 0.01;

class Bank {
	static changeLedger(user, amount) {
		redis.db.hgetAsync('ledger', user).then(balance => {
			balance = parseInt(balance) || 0;
			redis.db.hsetAsync('ledger', user, amount + parseInt(balance));
		});
	}

	static async getBalance(user) {
		const balance = await redis.db.hgetAsync('ledger', user) || 0;
		return balance;
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
		const bankBalanceDelta = bankBalance - previousBankBalance;

		redis.db.hgetallAsync('ledger').then(balances => {
			for (const [user, balance] of balances.entries()) {
				redis.db.hsetAsync('ledger', user, Math.round(balance * (interestRate + 1)));
			}
		});

		const newInterestRate = Math.max(0, interestRate + (bankBalanceDelta * -INTEREST_MATURE_RATE));
		redis.db.setAsync('interestrate', newInterestRate);
	}

	static async getInterestRate() {
		const interestRate = await redis.db.getAsync('interestrate') || 0.01;

		return parseInt(interestRate);
	}
}

module.exports = Bank;

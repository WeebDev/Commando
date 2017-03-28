const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');
const moment = require('moment');

const Bank = require('../../structures/currency/Bank');
const Currency = require('../../structures/currency/Currency');

module.exports = class BankInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'bank',
			group: 'economy',
			memberName: 'bank',
			description: `Displays info about the bank.`,
			details: `Displays the balance and interest rate of the bank.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	async run(msg) {
		const balance = await Currency.getBalance('bank');
		const interestRate = await Bank.getInterestRate();
		const nextUpdate = await Bank.nextUpdate();

		return msg.reply(stripIndents`
			the bank currently has ${Currency.convert(balance)}.
			The current interest rate is ${(interestRate * 100).toFixed(3)}%.
			Interest will be applied in ${moment.duration(nextUpdate).format('hh [hours] mm [minutes]')}.
		`);
	}
};

const { Command } = require('discord.js-commando');

const Currency = require('../../Currency');

const currency = new Currency();

module.exports = class MoneyTradeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'trade-money',
			aliases: ['trade-donut', 'trade-donuts', 'money-trade', 'donut-trade', 'donuts-trade'],
			group: 'currency',
			memberName: 'trade',
			description: 'Trades the money you have earned.',
			details: 'Trades the amount of money you have earned.',

			args: [
				{
					key: 'member',
					prompt: 'What user would you like to give donuts?',
					type: 'member'
				},
				{
					key: 'donuts',
					prompt: 'How many donuts do you want to give that user?',
					type: 'integer'
				}
			]
		});
	}

	async run(msg, args) {
		const user = args.member;
		const donuts = args.donuts;

		const userBalance = await currency.getBalance(msg.author.id);

		if (userBalance < args.donuts) {
			return msg.say(`You don't have that many donuts to trade! Your current account balance is ${userBalance} 🍩s.`);
		}

		currency.removeBalance(msg.author.id, donuts);
		currency.addBalance(user.id, donuts);

		return msg.reply(`${user.displayName} successfully received your ${donuts} 🍩s!`);
	}
};

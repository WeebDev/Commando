const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Currency = require('../../currency/Currency');

module.exports = class MoneyTradeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'trade',
			aliases: ['trade-donut', 'donut-trade', 'trade-donuts', 'donuts-trade', 'trade-money', 'money-trade'],
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

		if (user.id === msg.author.id) return msg.reply('you can\'t trade donuts with yourself, ya dingus.');
		if (user.user.bot) return msg.reply('don\'t give your donuts to bots: they\'re bots, man.');
		if (donuts <= 0) return msg.reply('man, get outta here!');

		const userBalance = await Currency.getBalance(msg.author.id);

		if (userBalance < donuts) {
			return msg.reply(stripIndents`
				you don't have that many donuts to trade!
				Your current account balance is ${userBalance} 🍩s.
			`);
		}

		Currency.removeBalance(msg.author.id, donuts);
		Currency.addBalance(user.id, donuts);

		return msg.reply(`${user.displayName} successfully received your ${donuts} 🍩s!`);
	}
};

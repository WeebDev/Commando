const { Command } = require('discord.js-commando');

const Currency = require('../../currency/Currency');
const Bank = require('../../currency/Bank');

module.exports = class MoneyInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'money',
			aliases: ['donut', 'donuts', 'doughnut', 'doughnuts'],
			group: 'economy',
			memberName: 'money',
			description: `Displays the ${Currency.textPlural} you have earned.`,
			details: `Displays the ${Currency.textPlural} you have earned.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'member',
					prompt: `which user's ${Currency.textPlural} would you like to view?\n`,
					type: 'member',
					default: ''
				}
			]
		});
	}

	async run(msg, args) {
		const user = args.member || msg.author;

		const money = await Currency.getBalance(user.id);
		const balance = await Bank.getBalance(user.id) || 0;

		if (args.member) {
			if (money === null) return msg.reply(`${user.displayName} hasn't earned any ${Currency.textPlural} yet.`);

			return msg.reply(`${user.displayName} has ${Currency.convert(money)} on hand and ${Currency.convert(balance)} in the bank. Good on them!`);
		} else {
			if (money === null) return msg.reply(`you haven't earned any ${Currency.textPlural} yet.`);

			return msg.reply(`you have ${Currency.convert(money)} on hand and ${Currency.convert(balance)} in the bank. Good on you!`);
		}
	}
};

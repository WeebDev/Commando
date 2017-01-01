const { Command } = require('discord.js-commando');

const Currency = require('../../currency/Currency');

const currency = new Currency();

module.exports = class MoneyInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'money',
			aliases: ['donut', 'donuts'],
			group: 'currency',
			memberName: 'info',
			description: 'Displays the money you have earned.',
			details: 'Display the amount of money you have earned.',

			args: [
				{
					key: 'member',
					prompt: 'What users earning would you like to view?',
					type: 'member',
					default: ''
				}
			]
		});
	}

	async run(msg, args) {
		const user = args.member || msg.author;

		const balance = await currency.getBalance(user.id);

		if (args.member) {
			if (!balance) return msg.reply(`${user.displayName} hasn't earned any 🍩s yet :(`);

			return msg.reply(`${user.displayName} has earned ${balance} 🍩s so far. Good on them!`);
		} else {
			if (!balance) return msg.reply('you haven\'t earned any 🍩s yet, sorry :(');

			return msg.reply(`you have earned ${balance} 🍩s so far. Good on you!`);
		}
	}
};

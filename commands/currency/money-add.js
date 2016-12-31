const { Command } = require('discord.js-commando');

const Currency = require('../../Currency');

const currency = new Currency();

module.exports = class MoneyAddCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'add-money',
			aliases: ['add-donut', 'add-donuts', 'money-add', 'donut-add', 'donuts-add'],
			group: 'currency',
			memberName: 'add',
			description: 'Displays the money you have earned.',
			details: 'Display the amount of money you have earned.',

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

	hasPermission(msg) {
		return msg.author.id === this.client.options.owner;
	}

	async run(msg, args) {
		const user = args.member;
		const donuts = args.donuts;

		currency.addBalance(user.id, donuts);

		return msg.reply(`successfully added ${donuts} 🍩s to ${user.displayName}s balance.`);
	}
};

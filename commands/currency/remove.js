const { Command } = require('discord.js-commando');

const Currency = require('../../currency/Currency');

module.exports = class MoneyRemoveCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'remove-money',
			aliases: ['remove-donut', 'remove-donuts', 'money-remove', 'donut-remove', 'donuts-remove'],
			group: 'currency',
			memberName: 'remove',
			description: 'Displays the money you have earned.',
			details: 'Display the amount of money you have earned.',

			args: [
				{
					key: 'member',
					prompt: 'From which user would you like to remove donuts?',
					type: 'member'
				},
				{
					key: 'donuts',
					prompt: 'How many donuts do you want to remove from that user?',
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

		Currency.removeBalance(user.id, donuts);

		return msg.reply(`successfully removed ${donuts} 🍩s from ${user.displayName}'s balance.`);
	}
};

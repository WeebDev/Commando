const { Command } = require('discord.js-commando');

const Currency = require('../../currency/Currency');

module.exports = class MoneyRemoveCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'remove-money',
			aliases: [
				'money-remove',
				'remove-donut',
				'remove-donuts',
				'remove-doughnut',
				'remove-doughnuts',
				'donut-remove',
				'donuts-remove',
				'doughnut-remove',
				'doughnuts-remove'
			],
			group: 'economy',
			memberName: 'remove',
			description: 'Remove money from a certain user.',
			details: 'Remove amount of money from a certain user.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'member',
					prompt: 'from which user would you like to remove donuts?\n',
					type: 'member'
				},
				{
					key: 'donuts',
					prompt: 'how many donuts do you want to remove from that user?\n',
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

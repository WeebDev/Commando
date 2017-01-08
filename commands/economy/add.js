const { Command } = require('discord.js-commando');

const Currency = require('../../currency/Currency');

module.exports = class MoneyAddCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'add-money',
			aliases: [
				'money-add',
				'add-donut',
				'add-donuts',
				'add-doughnut',
				'add-doughnuts',
				'donut-add',
				'donuts-add',
				'doughnut-add',
				'doughnuts-add'
			],
			group: 'economy',
			memberName: 'add',
			description: 'Add money to a certain user.',
			details: 'Add amount of money to a certain user.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'member',
					prompt: 'what user would you like to give donuts?\n',
					type: 'member'
				},
				{
					key: 'donuts',
					prompt: 'how many donuts do you want to give that user?\n',
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

		Currency.addBalance(user.id, donuts);

		return msg.reply(`successfully added ${donuts} 🍩s to ${user.displayName}'s balance.`);
	}
};

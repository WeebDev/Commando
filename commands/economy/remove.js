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
			description: `Remove ${Currency.plural} from a certain user.`,
			details: `Remove amount of ${Currency.plural} from a certain user.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'member',
					prompt: `from which user would you like to remove ${Currency.plural}?\n`,
					type: 'member'
				},
				{
					key: 'donuts',
					prompt: `how many ${Currency.plural} do you want to remove from that user?\n`,
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

		return msg.reply(`successfully removed ${Currency.convert(donuts)} from ${user.displayName}'s balance.`);
	}
};

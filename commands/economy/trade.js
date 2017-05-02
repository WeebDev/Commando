const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');

const Currency = require('../../structures/currency/Currency');

module.exports = class MoneyTradeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'trade',
			aliases: [
				'trade-money',
				'trade-donut',
				'trade-donuts',
				'trade-doughnut',
				'trade-doughnuts',
				'money-trade',
				'donut-trade',
				'donuts-trade',
				'doughnut-trade',
				'doughnuts-trade'
			],
			group: 'economy',
			memberName: 'trade',
			description: `Trades the ${Currency.textPlural} you have earned.`,
			details: `Trades the amount of ${Currency.textPlural} you have earned.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'member',
					prompt: `what user would you like to give ${Currency.textPlural}?\n`,
					type: 'member'
				},
				{
					key: 'donuts',
					label: 'amount of donuts to trade',
					prompt: `how many ${Currency.textPlural} do you want to give that user?\n`,
					validate: donuts => /^(?:\d+|all|-all|-a)$/g.test(donuts),
					parse: async (donuts, msg) => {
						const balance = await Currency.getBalance(msg.author.id);

						if (['all', '-all', '-a'].includes(donuts)) return parseInt(balance);

						return parseInt(donuts);
					}
				}
			]
		});
	}

	async run(msg, { member, donuts }) {
		if (member.id === msg.author.id) return msg.reply(`you can't trade ${Currency.textPlural} with yourself, ya dingus.`); // eslint-disable-line
		if (member.user.bot) return msg.reply(`don't give your ${Currency.textPlural} to bots: they're bots, man.`);
		if (donuts <= 0) return msg.reply(`you can't trade 0 or less ${Currency.convert(0)}.`);

		const userBalance = await Currency.getBalance(msg.author.id);
		if (userBalance < donuts) {
			return msg.reply(stripIndents`
				you don't have that many ${Currency.textPlural} to trade!
				You currently have ${Currency.convert(userBalance)} on hand.
			`);
		}

		Currency.removeBalance(msg.author.id, donuts);
		Currency.addBalance(member.id, donuts);

		return msg.reply(`${member.displayName} successfully received your ${Currency.convert(donuts)}!`);
	}
};

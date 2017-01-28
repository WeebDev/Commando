const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Currency = require('../../currency/Currency');
const Bank = require('../../currency/Bank');

module.exports = class DepositCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'deposit',
			group: 'economy',
			memberName: 'deposit',
			description: `Deposit ${Currency.textPlural} into the bank.`,
			details: `Deposit ${Currency.textPlural} into the bank.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'donuts',
					label: 'amount of donuts to deposit',
					prompt: `how many ${Currency.textPlural} do you want to deposit?\n`,
					validate: donuts => {
						return /^(?:\d+|-all|-a)$/g.test(donuts);
					},
					parse: async (donuts, msg) => {
						const balance = await Currency.getBalance(msg.author.id);

						if (donuts === '-all') return parseInt(balance);
						return parseInt(donuts);
					}
				}
			]
		});
	}

	async run(msg, args) {
		const donuts = args.donuts;

		if (donuts <= 0) return msg.reply(`you can't deposit 0 or less ${Currency.convert(0)}.`);

		const userBalance = await Currency.getBalance(msg.author.id);

		if (userBalance < donuts) {
			return msg.reply(stripIndents`
				you don't have that many ${Currency.textPlural} to deposit!
				You currently have ${Currency.convert(userBalance)} on hand.
			`);
		}

		Bank.deposit(msg.author.id, donuts);

		return msg.reply(`Successfully deposited ${Currency.convert(donuts)} to the bank!`);
	}
};

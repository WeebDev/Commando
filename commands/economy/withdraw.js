const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');

const Bank = require('../../structures/currency/Bank');
const Currency = require('../../structures/currency/Currency');

module.exports = class WidthdrawCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'withdraw',
			group: 'economy',
			memberName: 'withdraw',
			description: `Withdraw ${Currency.textPlural} from the bank.`,
			details: `Withdraw ${Currency.textPlural} from the bank.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'donuts',
					label: 'amount of donuts to withdraw',
					prompt: `how many ${Currency.textPlural} do you want to withdraw?\n`,
					validate: donuts => /^(?:\d+|all|-all|-a)$/g.test(donuts),
					parse: async (donuts, msg) => {
						const balance = await Bank.getBalance(msg.author.id);

						if (['all', '-all', '-a'].includes(donuts)) return parseInt(balance);

						return parseInt(donuts);
					}
				}
			]
		});
	}

	async run(msg, { donuts }) {
		if (donuts <= 0) return msg.reply(`you can't widthdraw 0 or less ${Currency.convert(0)}.`);

		const userBalance = await Bank.getBalance(msg.author.id);
		if (userBalance < donuts) {
			return msg.reply(stripIndents`
				you do not have that many ${Currency.textPlural} in your balance!
				Your current balance is ${Currency.convert(userBalance)}.
			`);
		}

		const bankBalance = await Currency.getBalance('bank');
		if (bankBalance < donuts) {
			return msg.reply(stripIndents`
				sorry, but the bank doesn't have enough ${Currency.textPlural} for you to withdraw!
				Please try again later.
			`);
		}

		Bank.withdraw(msg.author.id, donuts);

		return msg.reply(`successfully withdrew ${Currency.convert(donuts)} from the bank!`);
	}
};

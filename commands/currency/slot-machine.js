const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Currency = require('../../Currency');

const currency = new Currency();

const symbols = ['🍒', '💰', '⭐', '🎲', '💎', '❤', '⚜', '🔅', '🎉'];

module.exports = class SlotMachineCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'slotmachine',
			aliases: ['slot-machine'],
			group: 'currency',
			memberName: 'slotmachine',
			description: 'Let\'s you play a round with the slot machine',
			details: 'Bet some amount of money, and enjoy a round with the slot machine.\nDoubles your money if you win!',

			args: [
				{
					key: 'bet',
					prompt: 'How much money do you want to bet?',
					type: 'integer',
					default: '100'
				}
			]
		});
	}

	async run(msg, args) {
		const columns = [
			symbols[Math.floor(Math.random() * symbols.length)],
			symbols[Math.floor(Math.random() * symbols.length)],
			symbols[Math.floor(Math.random() * symbols.length)]
		];
		currency.removeBalance(msg.author.id, args.bet);

		if (columns[0] === '💎' && columns[1] === '💎' && columns[2] === '💎') {
			currency.addBalance(msg.author.id, args.bet * 3);
			return msg.reply(stripIndents`
				The wheels of the machine are spinning... you see ${columns.join('|')} in front of you.
				Three diamonds in a row! Congratulations, you got the jackpot!
				Your bet has been **tripled** and added to your account.
			`);
		}

		if (columns[0] === columns[1] && columns[1] === columns[2]) {
			currency.addBalance(msg.author.id, args.bet * 2);
			return msg.reply(stripIndents`
				The wheels of the machine are spinning... you see ${columns.join('|')} in front of you.
				Congratulations, you won! Your bet has been **doubled** and added to your account.
			`);
		}

		return msg.reply(stripIndents`
			The wheels of the machine are spinning... you rolled ${columns.join('|')}.
			Sorry, you didn't win. Your bet of ${args.bet} 🍩s has been removed from your account. :(
		`);
	}
};

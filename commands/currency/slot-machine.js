const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Currency = require('../../Currency');

const currency = new Currency();

const symbols = ['🍒', '💰', '⭐', '🎲', '💎', '❤', '⚜', '🔅', '🎉'];

const combinations = {
	'💎-💎-💎': 500,
	'⚜-⚜-⚜': 400,
	'💰-💰-💰': 400,
	'❤-❤-❤': 300,
	'⭐-⭐-⭐': 300,
	'🎲-🎲-🎲': 250,
	'🔅-🔅-🔅': 250,
	'🎉-🎉-🎉': 250,
	'🍒-🍒-🍒': 250
};

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
					key: 'donuts',
					prompt: 'How many donuts do you want to bet?',
					type: 'integer'
				}
			]
		});
	}

	async run(msg, args) {
		const userBalance = await currency.getBalance(msg.author.id);

		if (![200, 300, 400].includes(args.donuts)) {
			return msg.say('Sorry, you need to pay either 200, 300 or 400 🍩s. Anything else does not work.');
		}

		if (userBalance < 100) {
			return msg.say(`You don't enough donuts to pay your bet! Your current account balance is ${userBalance}🍩s.`);
		}

		currency.removeBalance(msg.author.id, 100);
		currency.addBalance('SLOTMACHINE', args.donuts);

		const columns = [
			symbols[Math.floor(Math.random() * symbols.length)],
			symbols[Math.floor(Math.random() * symbols.length)],
			symbols[Math.floor(Math.random() * symbols.length)]
		];

		const multiplier = [200, 300, 400].indexOf(args.donuts) + 1;

		if (!combinations.hasOwnProperty(columns.join('-'))) {
			return msg.reply(stripIndents`
				The reels of the machine are spinning... You rolled ${columns.join('|')}.
				Sorry, you just lost your money. Better luck next time.
			`);
		}

		currency.addBalance(msg.author.id, multiplier * combinations[columns.join('-')]);
		currency.removeBalance('SLOTMACHINE', multiplier * combinations[columns.join('-')]);
		return msg.reply(stripIndents`
				The reels of the machine are spinning... You rolled ${columns.join('|')}.
				Congratulations! You won ${multiplier * combinations[columns.join('-')]} 🍩s!
			`);
	}
};

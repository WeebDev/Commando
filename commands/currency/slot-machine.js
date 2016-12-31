const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Currency = require('../../Currency');

const currency = new Currency();

const symbols = ['🍒', '💰', '⭐', '🎲', '💎', '❤', '⚜', '🔅', '🎉'];

const combinations = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 4, 8], [2, 4, 6]];

const values = {
	'💎': 500,
	'⚜': 400,
	'💰': 400,
	'❤': 300,
	'⭐': 300,
	'🎲': 250,
	'🔅': 250,
	'🎉': 250,
	'🍒': 250
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

		if (![100, 200, 300].includes(args.donuts)) {
			return msg.say('Sorry, you need to pay either 100, 200 or 300 🍩s. Anything else does not work.');
		}

		if (userBalance < args.donuts) {
			return msg.say(`You don't have enough donuts to pay your bet! Your current account balance is ${userBalance} 🍩s.`);
		}

		currency.removeBalance(msg.author.id, args.donuts);
		currency.addBalance('SLOTMACHINE', args.donuts);

		let roll = this.generateRoll();
		let winnings = 0;

		combinations.forEach(combo => {
			if (roll[combo[0]] === roll[combo[1]] && roll[combo[1]] === roll[combo[2]]) {
				winnings += values[roll[combo[0]]];
			}
		});

		const multiplier = [100, 200, 300].indexOf(args.donuts) + 1;

		if (winnings === 0) {
			return msg.reply(stripIndents`
				The reels of the machine are spinning... You rolled:
				${this.showRoll(roll)}
				Sorry, you just lost your money. Better luck next time.
			`);
		}

		currency.addBalance(msg.author.id, multiplier * winnings);
		currency.removeBalance('SLOTMACHINE', multiplier * winnings);
		return msg.reply(stripIndents`
			The reels of the machine are spinning... You rolled:
			${this.showRoll(roll)}
			Congratulations! You won ${multiplier * winnings} 🍩s!
		`);
	}

	showRoll(roll) {
		return stripIndents`
				${roll[0]} | ${roll[1]} | ${roll[2]}
				${roll[3]} | ${roll[4]} | ${roll[5]}
				${roll[6]} | ${roll[7]} | ${roll[8]}
				`;
	}

	generateRoll() {
		let generated = [];
		for (let i = 0; i < 9; i++) {
			const sym = symbols[Math.floor(Math.random() * symbols.length)];
			if (i < 3) generated.push(sym);
			else if (i < 6 && sym !== generated[i - 3]) generated.push(sym);
			else if (sym !== generated[i - 3] && sym !== generated[i - 6]) generated.push(sym);
			else i--;
		}
		return generated;
	}
};

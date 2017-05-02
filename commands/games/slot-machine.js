const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');

const Currency = require('../../structures/currency/Currency');
const Inventory = require('../../structures/currency/Inventory');
const ItemGroup = require('../../structures/currency/ItemGroup');
const Store = require('../../structures/currency/Store');

const combinations = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 4, 8], [2, 4, 6]];
const reels = [
	['🍒', '💰', '⭐', '🎲', '💎', '❤', '⚜', '🔅', '🎉'],
	['💎', '🔅', '❤', '🍒', '🎉', '⚜', '🎲', '⭐', '💰'],
	['❤', '🎲', '💎', '⭐', '⚜', '🍒', '💰', '🎉', '🔅']
];

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
			name: 'slot-machine',
			aliases: ['slot', 'slots'],
			group: 'games',
			memberName: 'slot-machine',
			description: 'Let\'s you play a round with the slot machine',
			details: stripIndents`
				Bet some amount of coins, and enjoy a round with the slot machine.
			`,
			throttling: {
				usages: 1,
				duration: 5
			},

			args: [
				{
					key: 'coins',
					label: 'amount of coins',
					prompt: 'how many coins do you want to bet?\n',
					type: 'integer',
					validate: async (coins, msg) => {
						coins = parseInt(coins);
						const inventory = await Inventory.fetchInventory(msg.author.id);
						const userCoins = (inventory.content.coin || { amount: 0 }).amount;
						const plural = userCoins > 1 || userCoins === 0;
						if (userCoins < coins) {
							return `
								you don't have enough coins to pay your bet!
								Your current account balance is ${userCoins} coin${plural ? 's' : ''}.
								Please specify a valid amount of coins.
							`;
						}

						if (![1, 3, 5].includes(coins)) {
							return `
								you need to pay either 1, 3 or 5 coin(s).
							`;
						}

						return true;
					}
				}
			]
		});
	}

	async run(msg, { coins }) {
		const inventory = await Inventory.fetchInventory(msg.author.id);
		const item = Store.getItem('coin');

		inventory.removeItems(new ItemGroup(item, coins));
		inventory.save();
		Currency.addBalance('bank', coins * 100);
		const roll = this.generateRoll();
		let winnings = 0;

		combinations.forEach(combo => {
			if (roll[combo[0]] === roll[combo[1]] && roll[combo[1]] === roll[combo[2]]) {
				winnings += values[roll[combo[0]]];
			}
		});

		if (winnings === 0) {
			return msg.embed({
				color: 0xBE1931,
				description: stripIndents`
					**${msg.member.displayName}, you rolled:**

					${this.showRoll(roll)}

					**You lost!**
					Better luck next time!
				`
			});
		}

		Currency.addBalance(msg.author.id, coins * winnings);

		return msg.embed({
			color: 0x5C913B,
			description: stripIndents`
				**${msg.member.displayName}, you rolled:**

				${this.showRoll(roll)}

				**Congratulations!**
				You won ${Currency.convert(coins * winnings)}!
			`
		});
	}

	showRoll(roll) {
		return stripIndents`
			${roll[0]}ー${roll[1]}ー${roll[2]}
			${roll[3]}ー${roll[4]}ー${roll[5]}
			${roll[6]}ー${roll[7]}ー${roll[8]}
		`;
	}

	generateRoll() {
		const roll = [];
		reels.forEach((reel, index) => {
			const rand = Math.floor(Math.random() * reel.length);
			roll[index] = rand === 0 ? reel[reel.length - 1] : reel[rand - 1];
			roll[index + 3] = reel[rand];
			roll[index + 6] = rand === reel.length - 1 ? reel[0] : reel[rand + 1];
		});

		return roll;
	}
};

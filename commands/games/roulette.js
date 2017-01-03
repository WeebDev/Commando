const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Currency = require('../../currency/Currency');
const Roulette = require('../../Roulette');

const currency = new Currency();

module.exports = class RouletteCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'roulette',
			aliases: ['roulette', 'bet'],
			group: 'games',
			memberName: 'roulette',
			description: 'Play a game of russian roulette for donuts!',
			details: 'Play a game of russian roulette for donuts.',
			throttling: {
				duration: 30,
				usages: 1
			},
			args: [
				{
					key: 'donuts',
					prompt: 'How many donuts do you want to bet?',
					type: 'integer'
				}, {
					key: 'space',
					prompt: 'On what space do you want to bet?',
					type: 'string'
				}
			]
		});
	}

	async run(msg, args) {
		const bet = args.donuts;
		const space = args.space.toLowerCase();

		const balance = await currency.getBalance(msg.author.id);
		let roulette = Roulette.findGame(msg.guild.id);

		if (balance < 100) {
			return msg.reply(`you don't have enough 🍩s. You need at least 100 🍩s to bet, but your current account balance is ${balance} 🍩s.`);
		}

		if (![100, 200, 300, 400, 500].includes(bet)) {
			return msg.say('you need to bet either 100, 200, 300, 400 or 500 donuts. Anything else does not work.');
		}

		if (roulette) {
			if (!roulette.hasSpace(space)) {
				return msg.reply('that is not a valid betting space. Use the `roulette-info` command for more information');
			}

			if (roulette.hasPlayer(msg.author.id)) {
				return msg.reply('you have already put a bet in this game of roulette.');
			}

			roulette.join(msg.author, bet, space);
			currency.removeBalance(msg.author.id, bet);

			return msg.reply(`you have successfully placed your bet of ${bet} on ${space}.`);
		}

		roulette = new Roulette(msg.guild.id);
		roulette.join(msg.author, bet, space);
		currency.removeBalance(msg.author.id, bet);

		return msg.say('A new game of roulette has been initiated! Use the `bet <donuts> <space>` command in the next 15 seconds to place your bet!').then(async () => {
			setTimeout(() => msg.say('10 seconds left for you to bet'), 5000);
			setTimeout(() => msg.say('5 more seconds for new people to bet'), 10000);
			setTimeout(() => msg.say('The roulette starts spinning!'), 14500);

			const winners = await roulette.awaitPlayers(10000).map(player => player.winnings !== 0);

			winners.forEach(winner => currency.addBalance(winner.user.id, winner.winnings));

			return msg.embed({
				description: stripIndents`
					The ball landed on: **${roulette.winSpaces[1]} ${roulette.winSpaces[0]}**!

					__**Winners**__
					${winners.map(winner => `${winner.user.username} won ${winner.user.winnings} 🍩s`).join('\n')}
				`
			});
		});
	}
};

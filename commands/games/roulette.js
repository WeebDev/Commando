const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Currency = require('../../currency/Currency');
const Roulette = require('../../games/Roulette');

const colors = {
	red: 0xBE1931,
	black: 0x0C0C0C
};

module.exports = class RouletteCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'roulette',
			aliases: ['roulette'],
			group: 'games',
			memberName: 'roulette',
			description: 'Play a game of roulette for donuts!',
			details: 'Play a game of roulette for donuts.',
			guildOnly: true,
			throttling: {
				usages: 1,
				duration: 30
			},

			args: [
				{
					key: 'bet',
					prompt: 'how many donuts do you want to bet?\n',
					type: 'integer',
					validate: async (bet, msg) => {
						bet = parseInt(bet);
						const balance = await Currency.getBalance(msg.author.id);

						if (balance < bet) {
							return `
								you don't have enough donuts to bet. Your current account balance is ${balance} 🍩s.
								Please specify a valid amount of donuts.
							`;
						}

						if (![100, 200, 300, 400, 500, 1000, 2000, 5000].includes(bet)) {
							return `
								please choose \`100, 200, 300, 400, 500, 1000, 2000, 5000\` for your bet.
							`;
						}

						return true;
					}
				},
				{
					key: 'space',
					prompt: 'on what space do you want to bet?',
					type: 'string',
					validate: space => {
						if (!Roulette.hasSpace(space)) {
							return `
								That is not a valid betting space. Use \`roulette-info\` for more information.
							`;
						}

						return true;
					}
				}
			]
		});
	}

	async run(msg, args) {
		const bet = args.bet;
		const space = args.space.toLowerCase();

		let roulette = Roulette.findGame(msg.guild.id);

		if (roulette) {
			if (roulette.hasPlayer(msg.author.id)) {
				return msg.reply('you have already put a bet in this game of roulette.');
			}

			roulette.join(msg.author, bet, space);
			Currency.removeBalance(msg.author.id, bet);

			return msg.reply(`you have successfully placed your bet of ${bet} on ${space}.`);
		}

		roulette = new Roulette(msg.guild.id);
		roulette.join(msg.author, bet, space);
		Currency.removeBalance(msg.author.id, bet);

		return msg.say(stripIndents`
			A new game of roulette has been initiated!

			Use \`roulette <donuts> <space>\` in the next 15 seconds to place your bet.
		`)
			.then(async () => {
				setTimeout(() => msg.say('5 more seconds for new people to bet.'), 10000);
				setTimeout(() => msg.say('The roulette starts spinning!'), 14500);

				const winners = await roulette.awaitPlayers(16000).filter(player => player.winnings !== 0);

				winners.forEach(winner => {
					Currency.addBalance(winner.user.id, winner.winnings);
				});

				return msg.embed({
					color: colors[roulette.winSpaces[1]] || null,
					description: stripIndents`
						The ball landed on: **${roulette.winSpaces[1]
							? roulette.winSpaces[1]
							: ''} ${roulette.winSpaces[0]}**!

						${winners.length !== 0
							? `__**Winners:**__
							${winners.map(winner => `${winner.user.username} won ${winner.winnings} 🍩s`).join('\n')}`
							: '__**No winner.**__'}
					`
				});
			});
	}
};

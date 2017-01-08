const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Currency = require('../../currency/Currency');

const games = [];
const combinations = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

module.exports = class BlackjackCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'blackjack',
			group: 'games',
			memberName: 'blackjack',
			description: 'Challenge someone to a game of tic-tac-toe for donuts!',
			details: 'Challenge someone to a game of tic-tac-toe for donuts.',
			guildOnly: true,
			throttling: {
				usages: 1,
				duration: 30
			},

			args: [
				{
					key: 'member',
					prompt: 'Which user would you like to challenge?',
					type: 'member'
				},
				{
					key: 'bet',
					prompt: 'How many donuts do you want to bet?',
					type: 'integer',
					max: 1000,
					validate: async (msg, bet) => {
						bet = parseInt(bet);
						const balance = await Currency.getBalance(msg.author.id);

						if (balance < bet) {
							return stripIndents`
								You don't have enough donuts. Your current account balance is ${balance} 🍩s.
								Please specify a valid amount of donuts.
								`;
						}

						if (![100, 200, 300, 400, 500, 1000].includes(bet)) {
							return 'Please choose one of 100, 200, 300, 400, 500, 1000 for your bet.';
						}

						return true;
					}
				}
			]
		});
	}

	async run(msg, args) {
		const bet = args.bet;
		const user = args.member;

		const userBalance = await Currency.getBalance(user.id);

		if (userBalance < bet) {
			return stripIndents`
				${user} doesn't have enough 🍩s. Their current account balance is ${userBalance} 🍩s.
				Please try again later.
				`;
		}

		if (games.indexOf(msg.guild.id) > -1) {
			return msg.reply(`you can't start 2 games of Tic-Tac-Toe one the same server at once.`);
		}

		games.push(msg.guild.id);

		const players = {};
		[players.x, players.o] = Math.random() > 0.5 ? [msg.member, user] : [user, msg.member];

		const field = [1, 2, 3, 4, 5, 6, 7, 8, 9];
		let turn = 'x';

		return msg.say(this.getField(field, players, turn))
			.then(async message => {
				while (!field.every(space => typeof space === 'string')) {
					await message.edit(this.getField(field, players, turn));
					const responses = await msg.channel.awaitMessages(msg2 => {
						return msg2.author.id === players[turn].id && [1, 2, 3, 4, 5, 6, 7, 8, 9].includes(parseInt(msg2.content));
					}, {
						maxMatches: 1,
						time: 20e3
					});

					if (responses.size === 0) {
						const loser = players[turn];
						const winner = players[turn === 'x' ? 'o' : 'x'];

						Currency.removeBalance(loser.id, bet);
						Currency.addBalance(winner.id, bet);

						return msg.say(`${loser.displayName} failed to respond in time. ${winner.displayName} won their ${bet} 🍩s!;`);
					}

					if (field.includes(parseInt(responses.first.content))) {
						field[field.indexOf(parseInt(responses.first.content))] = turn;
						turn = turn === 'x' ? 'o' : 'x';

						if (this.gameWon(field)) {
							const loser = players[turn === 'x' ? 'o' : 'x'];
							const winner = players[turn];

							Currency.removeBalance(loser.id, bet);
							Currency.addBalance(winner.id, bet);

							return msg.say(`Game over! ${winner.displayName} won ${bet} 🍩s from ${loser.displayName}.`);
						}
					}
				}

				games.splice(games.indexOf(msg.guild.id), 1);

				return msg.say(`Game over! It's a tie. Both participants keep their 🍩s.`);
			});
	}

	getField(field, players, turn) {
		return stripIndents`
			\`\`\`
			${field[0]} | ${field[1]} | ${field[2]}    |
			-----------   |   TicTacToe | ${players.x.displayName}(x) vs ${players.o.displayName}(o)
			${field[3]} | ${field[4]} | ${field[5]}    |   Turn: ${turn} - ${players[turn].displayName}
			-----------   |   Type the number of the space you want to occupy.
			${field[6]} | ${field[7]} | ${field[8]}    |
			\`\`\`
			`;
	}

	gameWon(field) {
		for (let combo in combinations) {
			if (field[combo[0]] === field[combo[1]] && field[combo[1]] === field[combo[2]]) {
				return true;
			}
		}

		return false;
	}
};

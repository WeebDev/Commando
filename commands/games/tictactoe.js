const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Currency = require('../../currency/Currency');

const games = [];
const combinations = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

module.exports = class TicTacToeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'tictactoe',
			group: 'games',
			memberName: 'tictactoe',
			description: 'Challenge someone to a game of tic-tac-toe for donuts!',
			guildOnly: true,
			throttling: {
				usages: 1,
				duration: 30
			},

			args: [
				{
					key: 'member',
					prompt: 'which user would you like to challenge?\n',
					type: 'member'
				},
				{
					key: 'bet',
					prompt: 'how many donuts do you want to bet?\n',
					type: 'integer',
					validate: async (bet, msg) => {
						bet = parseInt(bet);
						const balance = await Currency.getBalance(msg.author.id);

						if (balance < bet) {
							return stripIndents`
								You don't have enough donuts. Your current account balance is ${balance} 🍩s.
								Please specify a bet you can afford to make.
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
			return msg.reply(`you can't start 2 games of Tic-Tac-Toe on the same server at once.`);
		}

		const confirmed = this.confirmed(user, bet, msg);
		if (!confirmed) return msg.reply(`your challenge has not been accepted.`);

		games.push(msg.guild.id);

		const players = {};
		[players.x, players.o] = Math.random() > 0.5 ? [msg.member, user] : [user, msg.member];

		const field = [1, 2, 3, 4, 5, 6, 7, 8, 9];

		return msg.say(this.getField(field, players, 'x'))
			.then(async message => {
				const winSym = await this.getWinnerSymbol(field, players, message);

				if (!winSym) return msg.say(`Game over! It's a tie. Both participants keep their 🍩s.`);

				const winner = players[winSym];
				const loser = players[winSym === 'x' ? 'o' : 'x'];

				Currency.removeBalance(loser.id, bet);
				Currency.addBalance(winner.id, bet);

				games.splice(games.indexOf(msg.guild.id), 1);

				return msg.say(`Game Over! ${winner.displayName} wins ${bet} 🍩s!;`);
			});
	}

	confirmed(user, bet, msg) {
		return new Promise(async resolve => {
			msg.say(stripIndents`
				${user}, ${msg.member} challeges you to a game of tic-tac-toe for ${bet} 🍩s.
				Type \`accept\`to accept or \`reject\`to reject the challenge.
				Challenge will be automatically rejected in 30 seconds.
				`);
			const responses = await msg.channel.awaitMessages(msg2 => {
				return msg2.author.id === user.id && (msg2.content === 'accept' || msg2.content === 'reject');
			}, {
				maxMatches: 1,
				time: 30e3
			});

			if (responses.size === 0) return resolve(false);
			if (responses.first().content.toLowerCase() === 'reject') return resolve(false);
			return resolve(true);
		});
	}

	getWinnerSymbol(field, players, msg) {
		return new Promise(async resolve => {  // eslint-disable-line consistent-return
			let turn = 'x';
			while (!field.every(space => typeof space === 'string')) {
				msg.edit(this.getField(field, players, turn));
				const responses = await msg.channel.awaitMessages(msg2 => {
					return msg2.author.id === players[turn].id && [1, 2, 3, 4, 5, 6, 7, 8, 9].includes(parseInt(msg2.content));
				}, {
					maxMatches: 1,
					time: 20e3
				});

				if (responses.size === 0) return resolve(turn === 'x' ? 'o' : 'x');

				if (!field.includes(parseInt(responses.first().content))) {
					msg.say(`Space already occupied.`).then(msg3 => {
						setTimeout(() => msg3.delete(), 2000);
					});
				}

				if (field.includes(parseInt(responses.first().content))) {
					field[field.indexOf(parseInt(responses.first().content))] = turn;
					turn = turn === 'x' ? 'o' : 'x';

					if (this.gameWon(field)) return resolve(turn);
					if (field.every(space => typeof space === 'string')) return resolve(null);
				}
				responses.first().delete();
			}
		});
	}

	getField(field, players, turn) {
		const unicodeField = field.map(space => {
			if (space === 'x') return '❌';
			if (space === 'o') return '⭕';
			return space;
		});
		return stripIndents`
			\`\`\`
			${unicodeField[0]} | ${unicodeField[1]} | ${unicodeField[2]}    |   TicTacToe | ${players.x.displayName}(x) vs ${players.o.displayName}(o)
			----------   |   Turn: ${turn} - ${players[turn].displayName}
			${unicodeField[3]} | ${unicodeField[4]} | ${unicodeField[5]}    |   Type the number of the space you want to occupy.
			----------   |
			${unicodeField[6]} | ${unicodeField[7]} | ${unicodeField[8]}    |   If you don't respond within 20 seconds you lose automatically.
			\`\`\`
			`;
	}

	gameWon(field) {
		for (let combo in combinations) {
			if (field[combo[0]] === field[combo[1]] && field[combo[1]] === field[combo[2]]) return true;
		}

		return false;
	}
};

const { Collection } = require('discord.js');

const games = new Map();

const roulette = {
	red: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
	black: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35]
};

const spaces = new Collection([
	['numbers', { values: roulette.red.concat(roulette.black).concat([0]).map(item => item.toString()), multiplier: 36 }],
	['dozens', { values: ['1-12', '13-24', '25-36'], multiplier: 3 }],
	['columns', { values: ['1st', '2nd', '3rd'], multiplier: 3 }],
	['halves', { values: ['1-18', '19-36'], multiplier: 2 }],
	['parity', { values: ['even', 'odd'], multiplier: 2 }],
	['colors', { values: ['red', 'black'], multiplier: 2 }]
]);

class Roulette {
	constructor(guildID) {
		this.guildID = guildID;
		this.players = [];
		this.winSpaces = Roulette._generateSpaces();

		games.set(this.guildID, this);
	}

	join(user, donuts, space) {
		const multiplier = this.winSpaces.includes(space)
			? spaces.find(spc => spc.values.includes(space)).multiplier
			: 0;
		this.players.push({
			user,
			winnings: donuts * multiplier
		});

		games.set(this.guildID, this);
	}

	hasPlayer(userID) {
		return !!this.players.find(player => player.user.id === userID);
	}

	awaitPlayers(time) {
		return new Promise(resolve => {
			setTimeout(() => {
				games.delete(this.guildID);
				return resolve(this.players || []);
			}, time);
		});
	}

	static findGame(guildID) {
		return games.get(guildID) || null;
	}

	static hasSpace(space) {
		return !!spaces.find(spc => spc.values.includes(space));
	}

	static _generateSpaces() {
		const winNumber = Math.floor(Math.random() * 37);

		return [
			winNumber.toString(),
			Roulette._getColor(winNumber),
			Roulette._getRange(winNumber, 'dozens'),
			Roulette._getColumn(winNumber),
			Roulette._getRange(winNumber, 'halves'),
			Roulette._getParity(winNumber)
		];
	}

	static _getColor(number) {
		if (number === 0) return null;

		return roulette.red.includes(number) ? 'red' : 'black';
	}

	static _getRange(number, size) {
		if (number === 0) return null;

		return spaces.get(size).values.find(value => {
			const min = parseInt(value.split('-')[0]);
			const max = parseInt(value.split('-')[1]);
			return number >= min && number <= max;
		});
	}

	static _getColumn(number) {
		if (number === 0) return null;

		return spaces.get('columns').values[(number - 1) % 3];
	}

	static _getParity(number) {
		if (number === 0) return null;

		return spaces.get('parity').values[number % 2];
	}
}

module.exports = Roulette;

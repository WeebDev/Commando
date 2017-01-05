const games = new Map();

class RussianRoulette {
	constructor(guildID) {
		this.guildID = guildID;
		this.players = [];

		games.set(this.guildID, this);
	}

	static findGame(guildID) {
		return games.get(guildID) || null;
	}

	join(user, donuts) {
		this.players.push({
			user: user,
			donuts: donuts
		});

		games.set(this.guildID, this);
	}

	hasPlayer(userID) {
		return !!this.players.find(player => player.user.id === userID);
	}

	awaitPlayers(time) {
		return new Promise((resolve) => {
			setTimeout(() => {
				games.delete(this.guildID);
				return resolve(this.players);
			}, time);
		});
	}
}

module.exports = RussianRoulette;

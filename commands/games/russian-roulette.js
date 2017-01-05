const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Currency = require('../../currency/Currency');
const RussianRoulette = require('../../games/Russian-roulette');

const currency = new Currency();

module.exports = class RussianRouletteCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'russian-roulette',
			aliases: ['rus-roulette'],
			group: 'games',
			memberName: 'russian-roulette',
			description: 'Play a game of russian roulette for donuts!',
			details: 'Play a game of russian roulette for donuts.',
			throttling: {
				duration: 30,
				usages: 1
			}
		});
	}

	async run(msg) {
		const donuts = 120;
		const balance = await currency.getBalance(msg.author.id);
		let roulette = RussianRoulette.findGame(msg.guild.id);

		if (balance < donuts) return msg.reply(`you don't have enough donuts. You need ${donuts} 🍩s to join, but your current account balance is ${balance} 🍩s.`);

		if (roulette) {
			if (roulette.hasPlayer(msg.author.id)) return msg.reply('you have already joined this game of russian roulette.');
			if (roulette.players.length === 6) return msg.reply('only 6 people can join at a time. You\'ll have to wait for the next round');

			roulette.join(msg.author, donuts);

			return msg.reply('you have successfully joined the game.');
		}

		roulette = new RussianRoulette(msg.guild.id);
		roulette.join(msg.author, donuts);

		const barrel = this.generateBarrel();

		return msg.say('A new game of russian roulette has been initiated! Use the `roulette` command in the next 15 seconds to join!').then(async () => {
			setTimeout(() => msg.say('10 seconds left for you to join'), 5000);
			setTimeout(() => msg.say('5 more seconds for new people to join'), 10000);
			setTimeout(() => {
				if (roulette.players.length > 1) msg.say('The game begins!');
			}, 14500);

			const players = await roulette.awaitPlayers(15000);

			if (players.length === 1) return msg.say('Seems like no one else wanted to join. Ah well, maybe another time.');

			let deadPlayer = null;
			let survivors = [];

			for (const slot in barrel) {
				let currentPlayer = players[slot % players.length];
				if (!deadPlayer) deadPlayer = currentPlayer;
			}

			survivors = players.filter(player => player !== deadPlayer);

			currency.removeBalance(deadPlayer.user.id, 100);
			survivors.forEach(survivor => currency.addBalance(survivor.user.id, donuts / survivors.length));

			return msg.embed({
				description: stripIndents`
					__**Survivors**__
					${survivors.map(survivor => survivor.user.username).join('\n')}

					__**Reward**__
					Each of the survivors will receive ${donuts / survivors.length} 🍩s from ${deadPlayer.user.username}.
				`
			});
		});
	}

	generateBarrel() {
		let barrel = [0, 0, 0, 0, 0, 0];
		barrel[Math.floor(Math.random() * barrel.length)] = 1;
		return barrel;
	}
};

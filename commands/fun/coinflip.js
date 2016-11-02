const { Command } = require('discord.js-commando');

module.exports = class CoinflipCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'coinflip',
			aliases: ['flip', 'coin'],
			group: 'fun',
			memberName: 'coinflip',
			description: 'Flip a coin.'
		});
	}

	async run(msg) {
		return msg.say(`I flipped a coin for you and it landed on ${Math.random() < 0.5 ? 'heads' : 'tails'}, ${msg.author}.`);
	}
};

const { Command } = require('discord.js-commando');

module.exports = class LockCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'unlock-all',
			group: 'economy',
			memberName: 'unlock-all',
			description: 'Enable donut and xp gaining in a channel'
		});
	}

	async run(msg) {
		this.client.provider.set(msg.guild.id, 'locks', []);

		return msg.reply('the lock on all channels has been lifted. You can now earn xp and donuts on the entire server.');
	}
};

const { Command } = require('discord.js-commando');

module.exports = class LockCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'lock-all',
			group: 'economy',
			memberName: 'lock-all',
			description: 'Enable donut and xp gaining in a channel'
		});
	}

	async run(msg) {
		const channels = msg.guild.channels.filter(channel => channel.type === 'text');
		const channelLocks = this.client.provider.get(msg.guild.id, 'locks', []);

		for (const channel of channels.values()) {
			if (channelLocks.includes(channel.id)) continue;

			channelLocks.push(channel.id);
		}

		this.client.provider.set(msg.guild.id, 'locks', channelLocks);

		return msg.reply('all channels on this server have been locked. You can now no longer earn xp or donuts anywhere.');
	}
};

const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');

const Currency = require('../../structures/currency/Currency');

module.exports = class LockAllCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'lock-all',
			group: 'economy',
			memberName: 'lock-all',
			description: `Disable xp and ${Currency.textSingular} earning on all channels in the server.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	hasPermission(msg) {
		return this.client.isOwner(msg.author) || msg.member.hasPermission('MANAGE_GUILD');
	}

	run(msg) {
		const channels = msg.guild.channels.filter(channel => channel.type === 'text');
		const channelLocks = this.client.provider.get(msg.guild.id, 'locks', []);
		for (const channel of channels.values()) {
			if (channelLocks.includes(channel.id)) continue;
			channelLocks.push(channel.id);
		}

		this.client.provider.set(msg.guild.id, 'locks', channelLocks);

		return msg.reply(stripIndents`
			all channels on this server have been locked. You can no longer earn xp or ${Currency.textPlural} anywhere.
		`);
	}
};

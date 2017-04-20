const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');

const Currency = require('../../structures/currency/Currency');

module.exports = class LockCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'lock',
			group: 'economy',
			memberName: 'lock',
			description: `Disable xp and ${Currency.textSingular} earning in a channel.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'channel',
					prompt: 'what channel do you want to lock?\n',
					type: 'channel',
					default: ''
				}
			]
		});
	}

	hasPermission(msg) {
		return this.client.isOwner(msg.author) || msg.member.hasPermission('MANAGE_GUILD');
	}

	run(msg, args) {
		const channel = args.channel || msg.channel;
		if (channel.type !== 'text') return msg.reply('you can only lock text channels.');

		const channelLocks = this.client.provider.get(msg.guild.id, 'locks', []);
		if (channelLocks.includes(channel.id)) return msg.reply(`${channel} has already been locked.`);

		channelLocks.push(channel.id);
		this.client.provider.set(msg.guild.id, 'locks', channelLocks);

		return msg.reply(stripIndents`
			this channel has been locked. You can no longer earn xp or ${Currency.textPlural} in ${channel}.
		`);
	}
};

const { Command } = require('discord.js-commando');
const Currency = require('../../currency/Currency.js');
const stripIndents = require('common-tags').stripIndents;

module.exports = class UnlockCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'unlock',
			group: 'economy',
			memberName: 'unlock',
			description: `Enable xp and ${Currency.singular} earning in a channel.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'channel',
					prompt: 'what channel do you want to unlock?\n',
					type: 'channel',
					default: ''
				}
			]
		});
	}

	hasPermission(msg) {
		return msg.member.hasPermission('MANAGE_GUILD');
	}

	async run(msg, args) {
		const channel = args.channel || msg.channel;

		if (channel.type !== 'text') return msg.reply('you can only unlock text channels.');

		const channelLocks = this.client.provider.get(msg.guild.id, 'locks', []);

		if (!channelLocks.includes(channel.id)) {
			return msg.reply('this channel is not locked.');
		}

		const index = channelLocks.indexOf(channel.id);
		channelLocks.splice(index, 1);

		this.client.provider.set(msg.guild.id, 'locks', channelLocks);

		return msg.reply(stripIndents`
			the channel lock has been lifted. You can now earn xp and ${Currency.plural} again in ${channel}.
		`);
	}
};

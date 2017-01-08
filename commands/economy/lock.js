const { Command } = require('discord.js-commando');

module.exports = class LockCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'lock',
			group: 'economy',
			memberName: 'lock',
			description: 'Disable donut and xp earning in a channel.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'channel',
					prompt: 'What channel do you want to lock?',
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
		let channel = args.channel || msg.channel;

		if (channel.type !== 'text') return msg.reply('you can only lock text channels.');

		let channelLocks = this.client.provider.get(msg.guild.id, 'locks', []);

		if (channelLocks.includes(channel.id)) {
			return msg.reply(`${channel} has already been locked.`);
		}

		channelLocks.push(channel.id);

		this.client.provider.set(msg.guild.id, 'locks', channelLocks);

		return msg.reply(`this channel has been locked. No more xp or donuts will be earned in ${channel}.`);
	}
};

const { Command } = require('discord.js-commando');

module.exports = class LockCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'unlock',
			group: 'economy',
			memberName: 'unlock',
			description: 'Enable donut and xp gaining in a channel.',
			guildOnly: true

			args: [
				{
					key: 'channel',
					prompt: 'What channel do you want to unlock?',
					type: 'channel',
					default: ''
				}
			]
		});
	}

	async run(msg, args) {
		let channel = args.channel || msg.channel;

		if (channel.type !== 'text') return msg.reply('you can only unlock text channels.');

		let channelLocks = this.client.provider.get(msg.guild.id, 'locks', []);

		if (!channelLocks.includes(channel.id)) {
			return msg.reply('this channel is not locked.');
		}

		const index = channelLocks.indexOf(channel.id);
		channelLocks.splice(index, 1);

		this.client.provider.set(msg.guild.id, 'locks', channelLocks);

		return msg.reply(`the channel lock has been lifted. You can now earn donuts and xp again in ${channel}.`);
	}
};

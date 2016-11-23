const { Command } = require('discord.js-commando');
const moment = require('moment');
require('moment-duration-format');

const version = require('../../package').version;

module.exports = class StatsCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'stats',
			aliases: ['statistics'],
			group: 'util',
			memberName: 'stats',
			description: 'Displays statistics about the bot.',
			guildOnly: true
		});
	}

	async run(msg) {
		let embed = {
			color: 3447003,
			description: '**Commando Statistics**\n',
			fields: [
				{
					name: '❯ Uptime',
					value: moment.duration(this.client.uptime).format('d[ days], h[ hours], m[ minutes, and ]s[ seconds]')
				},
				{
					name: '❯ Memory usage',
					value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
					inline: true
				},
				{
					name: '❯ Version',
					value: version,
					inline: true
				},
				{
					name: '\u200B',
					value: '\u200B'
				}
			],
			thumbnail: { url: this.client.user.avatarURL },
			timestamp: new Date(),
			footer: {
				icon_url: this.client.user.avatarURL, // eslint-disable-line camelcase
				text: 'Statistics'
			}
		};

		return msg.channel.sendMessage('', { embed });
	}
};

const { Command } = require('discord.js-commando');
const moment = require('moment');
const stripIndents = require('common-tags').stripIndents;
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
		return msg.code('md', stripIndents`
			<Commando Statistics>

			[UPTIME](${moment.duration(this.client.uptime).format('d[ DAYS], h[ HOURS], m[ MINUTES, and ]s[ SECONDS]')})
			[MEMORY USAGE](${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB)
			[VERSION](${version})
		`);
	}
};

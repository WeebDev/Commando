const { Command } = require('discord.js-commando');
const moment = require('moment');
const stripIndents = require('common-tags').stripIndents;

const version = require('../../package.json').version;

module.exports = class UserInfoCommand extends Command {
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

	hasPermission(msg) {
		return msg.author.id === this.client.options.owner;
	}

	async run(msg) {
		return msg.say(stripIndents`\`\`\`md
				<Commando Statistics>

				[UPTIME](${moment.duration(this.client.uptime).format('d[ DAYS], h[ HOURS], m[ MINUTES, and ]s[ SECONDS]')})
				[MEMORY USEAGE](${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB)
				[VERSION](${version})
				\`\`\`
			`);
	}
};

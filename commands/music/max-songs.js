const { Command } = require('discord.js-commando');
const { oneLine } = require('common-tags');

const config = require('../../settings');

module.exports = class MaxSongsCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'max-songs',
			group: 'music',
			memberName: 'max-songs',
			description: 'Shows or sets the max songs per user.',
			format: '[amount|"default"]',
			details: oneLine`
				This is the maximum number of songs a user may have in the queue.
				The default is ${config.maxSongs}.
				Only administrators may change this setting.
			`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	hasPermission(msg) {
		return msg.member.hasPermission('ADMINISTRATOR');
	}

	async run(msg, args) {
		if (!args) {
			const maxSongs = this.client.provider.get(msg.guild.id, 'maxSongs', config.maxSongs);
			return msg.reply(`the maximum songs a user may have in the queue at one time is ${maxSongs}.`);
		}

		if (args.toLowerCase() === 'default') {
			this.client.provider.remove(msg.guild.id, 'maxSongs');
			return msg.reply(`set the maximum songs to the default (currently ${config.maxSongs}).`);
		}

		const maxSongs = parseInt(args);
		if (isNaN(maxSongs) || maxSongs <= 0) {
			return msg.reply(`invalid number provided.`);
		}

		this.client.provider.set(msg.guild.id, 'maxSongs', maxSongs);
		return msg.reply(`set the maximum songs to ${maxSongs}.`);
	}
};

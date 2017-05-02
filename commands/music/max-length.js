const { Command } = require('discord.js-commando');
const { oneLine } = require('common-tags');

const { MAX_LENGTH } = process.env;

module.exports = class MaxLengthCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'max-length',
			aliases: ['max-duration', 'max-song-length', 'max-song-duration'],
			group: 'music',
			memberName: 'max-length',
			description: 'Shows or sets the max song length.',
			format: '[minutes|"default"]',
			details: oneLine`
				This is the maximum length of a song that users may queue, in minutes.
				The default is ${MAX_LENGTH}.
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
		return this.client.isOwner(msg.author) || msg.member.hasPermission('ADMINISTRATOR');
	}

	run(msg, args) {
		if (!args) {
			const maxLength = this.client.provider.get(msg.guild.id, 'maxLength', MAX_LENGTH);
			return msg.reply(`the maximum length of a song is ${maxLength} minutes.`);
		}

		if (args.toLowerCase() === 'default') {
			this.client.provider.remove(msg.guild.id, 'maxLength');
			return msg.reply(`set the maximum song length to the default (currently ${MAX_LENGTH} minutes).`);
		}

		const maxLength = parseInt(args);
		if (isNaN(maxLength) || maxLength <= 0) {
			return msg.reply(`invalid number provided.`);
		}

		this.client.provider.set(msg.guild.id, 'maxLength', maxLength);

		return msg.reply(`set the maximum song length to ${maxLength} minutes.`);
	}
};

const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;
const winston = require('winston');

const TagModel = require('../../mongoDB/models/Tag');

module.exports = class TagListCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'tag-list',
			aliases: ['tags'],
			group: 'tags',
			memberName: 'tag-list',
			description: 'Lists all server tags.',
			guildOnly: true
		});
	}

	async run(msg) {
		return TagModel.find(msg.guild.id).then(tags => {
			if (!tags) return msg.say(`${msg.guild.name} doesn't have any tags, ${msg.author}. Why not add one?`);
			let tagListMessage = {
				color: 3447003,
				author: {
					name: `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
					icon_url: `${msg.author.avatarURL}` // eslint-disable-line camelcase
				},
				description: stripIndents`
					**❯ Tags:**
					${tags.map(tag => tag.name).sort().join(', ')}
				`,
				timestamp: new Date(),
				footer: {
					icon_url: this.client.user.avatarURL, // eslint-disable-line camelcase
					text: 'Tag list'
				}
			};

			return msg.channel.sendMessage('', { embed: tagListMessage });
		}).catch(error => { winston.error(error); });
	}
};

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
			return msg.say(stripIndents`**❯ Tags:**
				${tags.map(tag => tag.name).join(', ')}
			`);
		}).catch(error => { winston.error(error); });
	}
};

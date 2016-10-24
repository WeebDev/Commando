/* eslint-disable no-console */
const { Command } = require('discord.js-commando');
const TagModel = require('../../mongoDB/models/tagModel.js');
const stripIndents = require('common-tags').stripIndents;

module.exports = class TagListCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'tag-list',
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
											${tags.map(tag => tag.name).join(', ')}`);
		}).catch(error => console.log(error));
	}
};

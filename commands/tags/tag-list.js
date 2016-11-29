const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Tag = require('../../postgreSQL/models/Tag');

module.exports = class TagListCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'tag-list',
			aliases: ['tags'],
			group: 'tags',
			memberName: 'tag-list',
			description: 'Lists all server tags.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	async run(msg) {
		let tags = await Tag.findAll({ where: { guildID: msg.guild.id } });
		if (!tags) return msg.say(`${msg.guild.name} doesn't have any tags, ${msg.author}. Why not add one?`);

		return msg.say(stripIndents`**❯ Tags:**
			${tags.filter(tag => tag.type)
				.filter(tag => !tag.example)
				.map(tag => tag.name)
				.sort()
				.join(', ')}

			**❯ Examples:**
			${tags.filter(tag => tag.type)
				.filter(tag => tag.example)
				.map(tag => tag.name)
				.sort()
				.join(', ')}

			**❯ ${msg.author.username}'s tags:**
			${tags.filter(tag => !tag.type)
				.filter(tag => tag.userID === msg.author.id)
				.map(tag => tag.name)
				.sort()
				.join(', ')}
		`);
	}
};

const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');

const Tag = require('../../models/Tag');

module.exports = class TagListAllCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'tag-list-all',
			aliases: ['tags-all', 'list-all-tags', 'tagsall', 'listalltags'],
			group: 'tags',
			memberName: 'list-all',
			description: 'Lists all tags.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	hasPermission(msg) {
		return this.client.isOwner(msg.author) || msg.member.roles.exists('name', 'Server Staff');
	}

	async run(msg) {
		const tags = await Tag.findAll({ where: { guildID: msg.guild.id } });
		if (!tags) return msg.say(`${msg.guild.name} doesn't have any tags, ${msg.author}. Why not add one?`);

		const allTags = tags.filter(tag => !tag.type)
			.map(tag => tag.name)
			.sort()
			.join(', ');
		console.log(allTags); // eslint-disable-line
		/* eslint-disable newline-per-chained-call */
		return msg.say(stripIndents`**❯ All tags:**
			${allTags ? allTags : `${msg.guild.name} has no tags.`}
		`, { split: true, char: ', ' });
		/* eslint-disable newline-per-chained-call */
	}
};

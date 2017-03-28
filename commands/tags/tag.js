const { Command } = require('discord.js-commando');

const Redis = require('../../structures/Redis');
const Tag = require('../../models/Tag');

const redis = new Redis();

module.exports = class TagCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'tag',
			group: 'tags',
			memberName: 'tag',
			description: 'Displays a tag.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'name',
					label: 'tagname',
					prompt: 'what tag would you like to see?\n',
					type: 'string',
					parse: str => str.toLowerCase()
				}
			]
		});
	}

	run(msg, args) {
		const { name } = args;
		return this.findCached(msg, name, msg.guild.id);
	}

	async findCached(msg, name, guildID) {
		const cache = await redis.db.getAsync(`tag${name}${guildID}`);
		if (cache) {
			const tag = await Tag.findOne({ where: { name, guildID } });
			if (tag) tag.increment('uses');
			return msg.say(cache);
		}

		const tag = await Tag.findOne({ where: { name: name, guildID: guildID } });
		if (!tag) return msg.say(`A tag with the name **${name}** doesn't exist, ${msg.author}`);
		tag.increment('uses');
		redis.db.setAsync(`tag${name}${guildID}`, tag.content)
		.then(() => {
			msg.say(tag.content);
		});
		return redis.db.expire(`tag${name}${guildID}`, 3600);
	}
};

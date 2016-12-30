const { Command } = require('discord.js-commando');

const Redis = require('../../redis/Redis');
const Tag = require('../../postgreSQL/models/Tag');

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
					prompt: 'What tag would you like to see?\n',
					type: 'string'
				}
			]
		});
	}

	async run(msg, args) {
		const name = args.name.toLowerCase();

		return this.findTagCached(msg, name, msg.guild.id);
	}

	async findTagCached(msg, name, guildID) {
		return redis.db.getAsync(name + guildID).then(async reply => {
			if (reply) {
				let tag = await Tag.findOne({ where: { name: name, guildID: guildID } });
				if (tag) tag.increment('uses');

				return msg.say(reply);
			} else {
				let tag = await Tag.findOne({ where: { name: name, guildID: guildID } });
				if (!tag) return msg.say(`A tag with the name **${name}** doesn't exist, ${msg.author}`);
				tag.increment('uses');

				return redis.db.setAsync(name + guildID, tag.content)
					.then(() => {
						msg.say(tag.content);
					});
			}
		});
	}
};

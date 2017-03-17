const { Command } = require('discord.js-commando');

const Redis = require('../../redis/Redis');
const Tag = require('../../postgreSQL/models/Tag');

const redis = new Redis();

module.exports = class TagSourceCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'tag-source',
			aliases: ['source-tag'],
			group: 'tags',
			memberName: 'source',
			description: 'Displays a tags source.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'name',
					label: 'tagname',
					prompt: 'what tag source would you like to see?\n',
					type: 'string'
				}
			]
		});
	}

	run(msg, args) {
		const name = args.name.toLowerCase();
		return this.findCached(msg, name, msg.guild.id);
	}

	async findCached(msg, name, guildID) {
		const cache = await redis.db.getAsync(`tag${name}${guildID}`);
		if (cache) return msg.code('md', cache);
		const tag = await Tag.findOne({ where: { name, guildID } });
		if (!tag) {
			return msg.say(`A tag with the name **${name}** doesn't exist, ${msg.author}`);
		}
		return redis.db.setAsync(`tag${name}${guildID}`, tag.content).then(() => msg.code('md', tag.content));
	}
};

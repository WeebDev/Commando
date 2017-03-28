const { Command } = require('discord.js-commando');

const Redis = require('../../redis/Redis');
const Tag = require('../../postgreSQL/models/Tag');
const Util = require('../../util/Util');

const redis = new Redis();

module.exports = class TagAddCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'add-tag',
			aliases: ['tag-add'],
			group: 'tags',
			memberName: 'add',
			description: 'Adds a tag.',
			details: `Adds a tag, usable for everyone on the server. (Markdown can be used.)`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'name',
					label: 'tagname',
					prompt: 'what would you like to name it?\n',
					type: 'string'
				},
				{
					key: 'content',
					label: 'tagcontent',
					prompt: 'what content would you like to add?\n',
					type: 'string',
					max: 1800
				}
			]
		});
	}

	async run(msg, args) {
		const name = Util.cleanContent(args.name.toLowerCase(), msg);
		const content = Util.cleanContent(args.content, msg);
		const tag = await Tag.findOne({ where: { name, guildID: msg.guild.id } });
		if (tag) return msg.say(`A tag with the name **${name}** already exists, ${msg.author}`);

		return Tag.sync()
			.then(() => {
				Tag.create({
					userID: msg.author.id,
					userName: `${msg.author.username}#${msg.author.discriminator}`,
					guildID: msg.guild.id,
					guildName: msg.guild.name,
					channelID: msg.channel.id,
					channelName: msg.channel.name,
					name: name,
					content: content
				});

				redis.db.setAsync(`tag${name}${msg.guild.id}`, content);
				return msg.say(`A tag with the name **${name}** has been added, ${msg.author}`);
			});
	}
};

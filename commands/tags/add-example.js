const { Command } = require('discord.js-commando');

const { exampleChannel } = require('../../settings');
const Redis = require('../../redis/Redis');
const Tag = require('../../postgreSQL/models/Tag');
const Util = require('../../util/Util');

const redis = new Redis();

module.exports = class ExampleAddCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'add-example',
			aliases: ['example-add', 'tag-add-example', 'add-example-tag'],
			group: 'tags',
			memberName: 'add-example',
			description: 'Adds an example.',
			details: `Adds an example and posts it into the #examples channel. (Markdown can be used.)`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'name',
					label: 'examplename',
					prompt: 'what would you like to name it?\n',
					type: 'string'
				},
				{
					key: 'content',
					label: 'examplecontent',
					prompt: 'what content would you like to add?\n',
					type: 'string',
					max: 1800
				}
			]
		});
	}

	hasPermission(msg) {
		return this.client.isOwner(msg.author) || msg.member.roles.exists('name', 'Server Staff');
	}

	async run(msg, args) {
		const name = Util.cleanContent(args.name.toLowerCase(), msg);
		const content = Util.cleanContent(args.content, msg);
		const staffRole = await msg.member.roles.exists('name', 'Server Staff');
		if (!staffRole) return msg.say(`Only the **Server Staff** can add examples, ${msg.author}`);

		const tag = await Tag.findOne({ where: { name, guildID: msg.guild.id } });
		if (tag) return msg.say(`An example with the name **${name}** already exists, ${msg.author}`);
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
					content: content,
					type: true,
					example: true
				});

				redis.db.setAsync(`tag${name}${msg.guild.id}`, content);

				msg.guild.channels.get(exampleChannel).sendMessage(content)
					.then(ex => Tag.update({ exampleID: ex.id }, { where: { name, guildID: msg.guild.id } }));
				return msg.say(`An example with the name **${name}** has been added, ${msg.author}`);
			});
	}
};

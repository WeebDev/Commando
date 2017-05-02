const { Command } = require('discord.js-commando');

const { EXAMPLE_CHANNEL } = process.env;
const Tag = require('../../models/Tag');
const Util = require('../../util/Util');

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
		const name = Util.cleanContent(msg, args.name.toLowerCase());
		const content = Util.cleanContent(msg, args.content);
		const tag = await Tag.findOne({ where: { name, guildID: msg.guild.id } });
		if (tag) return msg.say(`An example with the name **${name}** already exists, ${msg.author}`);

		await Tag.create({
			userID: msg.author.id,
			userName: `${msg.author.tag}`,
			guildID: msg.guild.id,
			guildName: msg.guild.name,
			channelID: msg.channel.id,
			channelName: msg.channel.name,
			name,
			content,
			type: true,
			example: true
		});

		const message = await msg.guild.channels.get(EXAMPLE_CHANNEL).send(content);
		Tag.update({ exampleID: message.id }, { where: { name, guildID: msg.guild.id } });

		return msg.say(`An example with the name **${name}** has been added, ${msg.author}`);
	}
};

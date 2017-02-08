const { Command } = require('discord.js-commando');

const config = require('../../settings');
const Redis = require('../../redis/Redis');
const Tag = require('../../postgreSQL/models/Tag');

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
		return msg.member.roles.exists('name', 'Server Staff');
	}

	async run(msg, args) {
		const name = args.name.toLowerCase();
		const content = args.content;
		const staffRole = await msg.member.roles.exists('name', 'Server Staff');
		if (!staffRole) return msg.say(`Only the **Server Staff** can add examples, ${msg.author}`);

		let tag = await Tag.findOne({ where: { name, guildID: msg.guild.id } });
		if (tag) return msg.say(`An example with the name **${name}** already exists, ${msg.author}`);

		let cleanContent = content.replace(/@everyone/g, '@\u200Beveryone')
			.replace(/@here/g, '@\u200Bhere')
			.replace(/<@&[0-9]+>/g, roles => {
				let replaceID = roles.replace(/<|&|>|@/g, '');
				let role = msg.channel.guild.roles.get(replaceID);
				return `@${role.name}`;
			})
			.replace(/<@!?[0-9]+>/g, user => {
				let replaceID = user.replace(/<|!|>|@/g, '');
				let member = msg.channel.guild.members.get(replaceID);
				return `@${member.user.username}`;
			});

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
					content: cleanContent,
					type: true,
					example: true
				});

				redis.db.setAsync(`tag${name}${msg.guild.id}`, cleanContent);

				msg.guild.channels.get(config.exampleChannel).sendMessage(cleanContent)
					.then(ex => {
						Tag.update({ exampleID: ex.id }, { where: { name, guildID: msg.guild.id } });
					});
				return msg.say(`An example with the name **${name}** has been added, ${msg.author}`);
			});
	}
};

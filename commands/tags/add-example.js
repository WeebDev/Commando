const { Command } = require('discord.js-commando');
const winston = require('winston');

const config = require('../../settings');
const { redis } = require('../../redis/redis');
const Tag = require('../../postgreSQL/models/Tag');

module.exports = class ExampleAddCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'add-example',
			aliases: ['example-add'],
			group: 'tags',
			memberName: 'example-add',
			description: 'Adds an example.',
			format: '<examplename> <examplecontent>',
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
					prompt: 'What would you like to name it?\n',
					type: 'string'
				},
				{
					key: 'content',
					label: 'examplecontent',
					prompt: 'What content would you like to add?\n',
					type: 'string',
					max: 1800
				}
			]
		});
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
		let exampleContent = `\`\`\`js\n${cleanContent}\n\`\`\``;

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
					content: exampleContent,
					type: true,
					example: true
				});

				redis.setAsync(name + msg.guild.id, exampleContent);

				msg.guild.channels.get(config.exampleChannel).sendMessage(`${name}\n${exampleContent}`)
					.then(ex => {
						Tag.update({ exampleID: ex.id }, { where: { name, guildID: msg.guild.id } });
					});
				return msg.say(`An example with the name **${name}** has been added, ${msg.author}`);
			})
			.catch(error => { winston.error(error); });
	}
};

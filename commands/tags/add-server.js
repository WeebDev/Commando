const { Command } = require('discord.js-commando');

const Redis = require('../../redis/Redis');
const Tag = require('../../postgreSQL/models/Tag');

const redis = new Redis();

module.exports = class ServerTagAddCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'add-server-tag',
			aliases: ['tag-add-server', 'add-servertag', 'servertag-add', 'servertag'],
			group: 'tags',
			memberName: 'add-server',
			description: 'Adds a server tag.',
			details: `Adds a server tag, usable for everyone on the server. (Markdown can be used.)`,
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

	hasPermission(msg) {
		return this.client.isOwner(msg.author) || msg.member.roles.exists('name', 'Server Staff');
	}

	async run(msg, args) {
		const name = this.content(args.name.toLowerCase(), msg);
		const content = this.cleanContent(args.content, msg);
		const staffRole = await msg.member.roles.exists('name', 'Server Staff');
		if (!staffRole) return msg.say(`Only the **Server Staff** can add server tags, ${msg.author}`);

		const tag = await Tag.findOne({ where: { name, guildID: msg.guild.id } });
		if (tag) return msg.say(`A server tag with the name **${name}** already exists, ${msg.author}`);

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
					type: true
				});

				redis.db.setAsync(`tag${name}${msg.guild.id}`, content);
				return msg.say(`A server tag with the name **${name}** has been added, ${msg.author}`);
			});
	}

	cleanContent(content, msg) {
		content.replace(/@everyone/g, '@\u200Beveryone')
			.replace(/@here/g, '@\u200Bhere')
			.replace(/<@&[0-9]+>/g, roles => {
				const replaceID = roles.replace(/<|&|>|@/g, '');
				const role = msg.channel.guild.roles.get(replaceID);
				return `@${role.name}`;
			})
			.replace(/<@!?[0-9]+>/g, user => {
				const replaceID = user.replace(/<|!|>|@/g, '');
				const member = msg.channel.guild.members.get(replaceID);
				return `@${member.user.username}`;
			});
	}
};

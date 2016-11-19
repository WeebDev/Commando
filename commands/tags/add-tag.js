const { Command } = require('discord.js-commando');
const winston = require('winston');

const { redis } = require('../../redis/redis');
const TagModel = require('../../mongoDB/models/Tag');

module.exports = class TagAddCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'add-tag',
			aliases: ['tag-add'],
			group: 'tags',
			memberName: 'tag-add',
			description: 'Adds a Tag.',
			format: '<tagname> <tagcontent>',
			details: `Adds a Tag, usable for everyone on the server. (Markdown can be used.)`,
			guildOnly: true,
			argsType: 'multiple',
			argsCount: 2,

			args: [
				{
					key: 'name',
					label: 'tagname',
					prompt: 'What would you like to name it?\n',
					type: 'string'
				},
				{
					key: 'content',
					label: 'tagcontent',
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

		TagModel.get(name, msg.guild.id).then(tag => {
			if (tag) return msg.say(`A tag with the name **${name}** already exists, ${msg.author}`);

			return new TagModel({
				userID: msg.author.id,
				userName: `${msg.author.username}#${msg.author.discriminator}`,
				guildID: msg.guild.id,
				guildName: msg.guild.name,
				channelID: msg.channel.id,
				channelName: msg.channel.name,
				name: name,
				content: content.replace(/@everyone/g, '@\u200Beveryone')
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
					})
			}).save().then(doc => {
				redis.set(name + msg.guild.id, doc.content);

				return msg.say(`A tag with the name **${name}** has been added, ${msg.author}`);
			});
		}).catch(error => { winston.error(error); });
	}
};

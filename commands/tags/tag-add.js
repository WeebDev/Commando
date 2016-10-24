/* eslint-disable no-console */
const { Command } = require('discord.js-commando');
const TagModel = require('../../mongoDB/models/tagModel.js');

module.exports = class TagAddCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'tag-add',
			group: 'tags',
			memberName: 'tag-add',
			description: 'Adds a Tag.',
			format: '<tagname> <tagcontent>',
			details: `Adds a Tag, usable for everyone on the server. (Markdown can be used.)`,
			examples: ['tag-add cat meow', 'tag-add test test1'],
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
					type: 'string'
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
					.replace(/<@!?[0-9]+>/g, input => {
						let replaceID = input.replace(/<|!|>|@/g, '');
						let member = msg.channel.guild.members.get(replaceID);
						return `@${member.user.username}`;
					})
			}).save().then(() => msg.say(`A tag with the name **${name}** has been added, ${msg.author}`));
		}).catch(error => console.log(error));
	}
};

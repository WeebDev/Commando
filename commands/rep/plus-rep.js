const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;
const winston = require('winston');

const RepModel = require('../../mongoDB/models/Rep');
const RepUserModel = require('../../mongoDB/models/RepUser');

module.exports = class RepPlusCommand extends Command {
	constructor(client) {
		super(client, {
			name: '+rep',
			aliases: ['rep-plus', 'plus-rep'],
			group: 'rep',
			memberName: 'plus-rep',
			description: 'Positive rep someone.',
			format: '<member> <reason>',
			details: `Positively rep someone, usable for everyone on the server. (Markdown can be used.)`,
			guildOnly: true,
			argsType: 'multiple',
			argsCount: 2,

			args: [
				{
					key: 'member',
					prompt: 'What user would you like to rep?\n',
					type: 'member'
				},
				{
					key: 'reason',
					label: 'repreason',
					prompt: 'What reason would you like to add?\n',
					type: 'string',
					max: 60
				}
			]
		});
	}

	async run(msg, args) {
		const member = args.member;
		const user = member.user;
		const reason = args.reason;

		if (user.id === msg.author.id) return msg.say(`You can't rep yourself, ${msg.author}`);

		return RepModel.get(user.id, msg.author.id, msg.guild.id).then(rep => {
			if (rep.createdAt + 86400000 > Date.now()) {
				return msg.say(stripIndents`You already rep'd **${user.username}**, ${msg.author}
					Please wait 24h.
				`);
			}
			return this.rep(msg, user, reason);
		}).catch(() => {
			return this.rep(msg, user, reason);
		});
	}

	async rep(msg, user, reason) {
		return new RepModel({
			userID: msg.author.id,
			userName: `${msg.author.username}#${msg.author.discriminator}`,
			targetID: user.id,
			targetName: `${user.username}#${user.discriminator}`,
			guildID: msg.guild.id,
			guildName: msg.guild.name,
			content: reason.replace(/@everyone/g, '@\u200Beveryone')
				.replace(/@here/g, '@\u200Bhere')
				.replace(/<@&[0-9]+>/g, roles => {
					let replaceID = roles.replace(/<|&|>|@/g, '');
					let role = msg.channel.guild.roles.get(replaceID);
					return `@${role.name}`;
				})
				.replace(/<@!?[0-9]+>/g, userName => {
					let replaceID = userName.replace(/<|!|>|@/g, '');
					let memberName = msg.channel.guild.members.get(replaceID);
					return `@${memberName.user.username}`;
				}),
			rep: '+',
			createdAt: Date.now()
		}).save().then(() => {
			return RepUserModel.get(user.id, msg.guild.id).then(repUser => {
				if (!repUser) {
					new RepUserModel({
						userID: user.id,
						userName: `${user.username}#${user.discriminator}`,
						guildID: msg.guild.id,
						guildName: msg.guild.name,
						positive: 1,
						createdAt: Date.now()
					}).save();
					return msg.say(`Successfully rep'd **${user.username}**, ${msg.author}`);
				}
				RepUserModel.incrementPositive(user.id, msg.guild.id);
				return msg.say(`Successfully rep'd **${user.username}**, ${msg.author}`);
			});
		})
		.catch(error => { winston.error(error); });
	}
};

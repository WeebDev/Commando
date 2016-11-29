const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Rep = require('../../postgreSQL/models/Rep');
const RepUser = require('../../postgreSQL/models/RepUser');

module.exports = class RepMinusCommand extends Command {
	constructor(client) {
		super(client, {
			name: '-rep',
			aliases: ['rep-minus', 'minus-rep'],
			group: 'rep',
			memberName: 'minus-rep',
			description: 'Negatively rep someone.',
			format: '<member> <reason>',
			details: `Negatively rep someone, usable for everyone on the server. (Markdown can be used.)`,
			guildOnly: true,
			autoAliases: false,
			throttling: {
				usages: 2,
				duration: 3
			},

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
					max: 250
				}
			]
		});
	}

	async run(msg, args) {
		const member = args.member;
		const user = member.user;
		const reason = args.reason;

		if (user.id === msg.author.id) return msg.say(`You can't rep yourself, ${msg.author}`);

		let rep = await Rep.findOne({ where: { userID: msg.author.id, targetID: user.id, guildID: msg.guild.id } });
		if (!rep) return this.rep(msg, user, reason);
		if (rep.createdAt + 86400000 > Date.now()) {
			return msg.say(stripIndents`You already rep'd **${user.username}**, ${msg.author}
				Please wait 24h.
			`);
		}

		return this.rep(msg, user, reason);
	}

	async rep(msg, user, reason) {
		let cleanContent = reason.replace(/@everyone/g, '@\u200Beveryone')
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
			});

		return Rep.sync()
			.then(() => {
				Rep.create({
					userID: msg.author.id,
					userName: `${msg.author.username}#${msg.author.discriminator}`,
					targetID: user.id,
					targetName: `${user.username}#${user.discriminator}`,
					guildID: msg.guild.id,
					guildName: msg.guild.name,
					content: cleanContent,
					rep: '-'
				});
			})
			.then(async () => {
				let repUser = await RepUser.findOne({ where: { userID: user.id, guildID: msg.guild.id } });
				if (!repUser) {
					RepUser.sync()
						.then(() => {
							RepUser.create({
								userID: user.id,
								userName: `${user.username}#${user.discriminator}`,
								guildID: msg.guild.id,
								guildName: msg.guild.name,
								negative: 1
							});
						});

					return msg.say(`Successfully rep'd **${user.username}**, ${msg.author}`);
				}
				RepUser.increment('negative');

				return msg.say(`Successfully rep'd **${user.username}**, ${msg.author}`);
			});
	}
};

const { Command } = require('discord.js-commando');
const starBoard = require('../../postgreSQL/models/StarBoard');
const { stripIndents } = require('common-tags');
const moment = require('moment');
const winston = require('winston');

module.exports = class StarCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'star',
			group: 'util',
			memberName: 'star',
			description: 'Stars a message.',
			examples: ['star 189696688657530880'],

			args: [
				{
					key: 'message',
					prompt: 'What would you like to star?\n',
					type: 'message',
					default: ''
				}
			]
		});
	}

	async run(msg, args) {
		const starboard = msg.guild.channels.find('name', 'starboard');

		if (args.message.author.id === msg.author.id) return msg.reply('sorry, you cannot star your own message!');
		let settings = await starBoard.findOne({ where: { guildID: msg.guild.id } });
		if (!settings) settings = await starBoard.create({ guildID: msg.guild.id });
		const starred = settings.starred;

		if (starred.hasOwnProperty(args.message.id)) {
			if (starred[args.message.id].stars.includes(msg.author.id)) return msg.reply('you cannot star the same message twice!');
			const starCount = starred[args.message.id].count += 1;
			const starredMessage = await starboard.fetchMessage(starred[args.message.id].starredMessageID).catch(error => winston.error(error));
			const edit = starredMessage.content.replace(`⭐ ${starCount - 1}`, `⭐ ${starCount}`);
			await starredMessage.edit(edit);
			starred[args.message.id].count = starCount;
			starred[args.message.id].stars.push(msg.author.id);
			settings.starred = starred;

			await settings.save().catch(error => winston.error(error));
		} else {
			const starCount = 1;
			let image;

			if (args.message.attachments.some(attachment => attachment.url.match(/\.(png|jpg|jpeg|gif|webp)$/))) image = args.message.attachments.first().url;
			const sentStar = await starboard.send(stripIndents`
				●▬▬▬▬▬▬▬▬▬▬▬▬▬▬●
				⭐ ${starCount}
				**Author**: \`${args.message.author.username} #${args.message.author.discriminator}\` | **Channel**: \`${args.message.channel.name}\` | **ID**: \`${args.message.id}\` | **Time**: \`${moment(new Date()).format('DD/MM/YYYY @ hh:mm:ss a')}\`
				**Message**:
				${args.message.cleanContent}
				`, { file: image }).catch(null);
			starred[args.message.id] = {};
			starred[args.message.id].author = args.message.author.id;
			starred[args.message.id].starredMessageID = sentStar.id;
			starred[args.message.id].count = starCount;
			starred[args.message.id].stars = [];
			starred[args.message.id].stars.push(msg.author.id);
			settings.starred = starred;

			await settings.save().catch(error => winston.error(error));
		}

		return msg.delete().catch(null);
	}
};

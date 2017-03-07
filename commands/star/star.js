const { Command } = require('discord.js-commando');
const starBoard = require('../../postgreSQL/models/StarBoard');
const path = require('path');
const { URL } = require('url');
const winston = require('winston');

module.exports = class StarCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'star',
			group: 'starboard',
			memberName: 'star',
			description: 'Stars a message.',
			examples: ['star 189696688657530880'],

			args: [
				{
					key: 'message',
					prompt: 'what would you like to star?\n',
					type: 'message'
				}
			]
		});
	}

	async run(msg, args) {
		const { message } = args;

		if (msg.member.joinedAt < 86400000) return; // eslint-disable-line consistent-return
		const starboard = msg.guild.channels.find('name', 'starboard');
		if (!starboard) return msg.reply('can\'t star things without a #starboard channel. Create one now!'); // eslint-disable-line consistent-return
		if (message.author.id === msg.author.id) {
			msg.reply('sorry, you cannot star your own message!');

			return msg.delete().catch(err => null); // eslint-disable-line
		}

		let settings = await starBoard.findOne({ where: { guildID: msg.guild.id } });
		if (!settings) settings = await starBoard.create({ guildID: msg.guild.id });
		const starred = settings.starred;

		if (starred.hasOwnProperty(message.id)) {
			if (starred[message.id].stars.includes(msg.author.id)) {
				msg.reply('you cannot star the same message twice!');

				return msg.delete().catch(err => null); // eslint-disable-line
			}

			const starCount = starred[message.id].count += 1;
			const starredMessage = await starboard.fetchMessage(starred[message.id].starredMessageID).catch(err => null); // eslint-disable-line
			const starredMessageContent = starred[message.id].starredMessageContent;
			const starredMessageAttachmentImage = starred[message.id].starredMessageImage;
			const starredMessageDate = starred[message.id].starredMessageDate;

			let edit;
			if ((starCount - 1) < 5) edit = starredMessage.embeds[0].footer.text.replace(`${starCount - 1} ⭐`, `${starCount} ⭐`);
			else if ((starCount - 1) >= 5 < 10) edit = starredMessage.embeds[0].footer.text.replace(`${starCount - 1} ⭐`, `${starCount} 🌟`);
			else if ((starCount - 1) >= 10) edit = starredMessage.embeds[0].footer.text.replace(`${starCount - 1} 🌟`, `${starCount} 🌠`);

			await starredMessage.edit({
				embed: {
					author: {
						icon_url: message.author.displayAvatarURL, // eslint-disable-line camelcase
						name: `${message.author.username}#${message.author.discriminator} (${message.author.id})`
					},
					color: 0xFFAC33,
					fields: [
						{
							name: 'ID',
							value: message.id,
							inline: true
						},
						{
							name: 'Channel',
							value: message.channel.toString(),
							inline: true
						},
						{
							name: 'Message',
							value: starredMessageContent ? starredMessageContent : '\u200B'
						}
					],
					image: { url: starredMessageAttachmentImage ? starredMessageAttachmentImage : undefined },
					timestamp: starredMessageDate,
					footer: { text: edit }
				}
			}).catch(null);

			starred[message.id].count = starCount;
			starred[message.id].stars.push(msg.author.id);
			settings.starred = starred;

			await settings.save();
		} else {
			const starCount = 1;
			let attachmentImage;
			const extensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
			const linkRegex = /https?:\/\/(?:\w+\.)?[\w-]+\.[\w]{2,3}(?:\/[\w-_\.]+)+\.(?:png|jpg|jpeg|gif|webp)/; // eslint-disable-line no-useless-escape

			if (message.attachments.some(attachment => {
				try {
					const url = new URL(attachment.url);
					const ext = path.extname(url.pathname);
					return extensions.has(ext);
				} catch (err) {
					if (err.message !== 'Invalid URL') winston.error(err);
					return false;
				}
			})) attachmentImage = message.attachments.first().url;

			if (!attachmentImage) {
				const linkMatch = message.content.match(linkRegex);
				if (linkMatch) {
					try {
						const url = new URL(linkMatch[0]);
						const ext = path.extname(url.pathname);
						if (extensions.has(ext)) attachmentImage = linkMatch[0]; // eslint-disable-line max-depth
					} catch (err) {
						if (err.message === 'Invalid URL') winston.info('No valid image link.'); // eslint-disable-line max-depth
						else winston.error(err);
					}
				}
			}

			const sentStar = await starboard.send({
				embed: {
					author: {
						icon_url: message.author.displayAvatarURL, // eslint-disable-line camelcase
						name: `${message.author.username}#${message.author.discriminator} (${message.author.id})`
					},
					color: 0xFFAC33,
					fields: [
						{
							name: 'ID',
							value: message.id,
							inline: true
						},
						{
							name: 'Channel',
							value: message.channel.toString(),
							inline: true
						},
						{
							name: 'Message',
							value: message.content ? message.cleanContent.substring(0, 1000) : '\u200B'
						}
					],
					image: { url: attachmentImage ? attachmentImage.toString() : undefined },
					timestamp: message.createdAt,
					footer: { text: `${starCount} ⭐` }
				}
			}).catch(err => null); // eslint-disable-line

			starred[message.id] = {};
			starred[message.id].author = message.author.id;
			starred[message.id].starredMessageID = sentStar.id;
			starred[message.id].starredMessageContent = message.cleanContent;
			starred[message.id].starredMessageImage = attachmentImage || '';
			starred[message.id].starredMessageDate = message.createdAt;
			starred[message.id].count = starCount;
			starred[message.id].stars = [];
			starred[message.id].stars.push(msg.author.id);
			settings.starred = starred;

			await settings.save();
		}

		return msg.delete().catch(err => null); // eslint-disable-line
	}
};

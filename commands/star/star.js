const { Command } = require('discord.js-commando');
const starBoard = require('../../postgreSQL/models/StarBoard');

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
		const message = args.message;

		const starboard = msg.guild.channels.find('name', 'starboard');
		if (!starboard) return msg.reply('can\'t star things without a #starboard channel. Create one now!');
		if (args.message.author.id === msg.author.id) {
			msg.reply('sorry, you cannot star your own message!');
			return msg.delete().catch(null);
		}

		let settings = await starBoard.findOne({ where: { guildID: msg.guild.id } });
		if (!settings) settings = await starBoard.create({ guildID: msg.guild.id });
		const starred = settings.starred;

		if (starred.hasOwnProperty(args.message.id)) {
			if (starred[args.message.id].stars.includes(msg.author.id)) {
				msg.reply('you cannot star the same message twice!');
				return msg.delete().catch(null);
			}

			const starCount = starred[args.message.id].count += 1;
			const starredMessage = await starboard.fetchMessage(starred[message.id].starredMessageID).catch(null);
			const starredMessageContent = starred[message.id].starredMessageContent;
			const starredMessageAttachmentImage = starred[message.id].starredMessageImage;
			const starredMessageDate = starred[message.id].starredMessageDate;
			const edit = starredMessage.embeds[0].footer.text.replace(`${starCount - 1} ⭐`, `${starCount} ⭐`);
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
			const attachmentRegex = /\.(png|jpg|jpeg|gif|webp)$/;
			const linkRegex = /https?:\/\/(?:\w+\.)?[\w-]+\.[\w]{2,3}(?:\/[\w-_\.]+)+\.(?:png|jpg|jpeg|gif|webp)/; // eslint-disable-line no-useless-escape
			if (message.attachments.some(attachment => attachment.url.match(attachmentRegex))) attachmentImage = message.attachments.first().url;
			if (message.content.match(linkRegex)) attachmentImage = message.content.match(linkRegex)[0];

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
							value: message.content ? message.cleanContent : '\u200B'
						}
					],
					image: { url: attachmentImage ? attachmentImage.toString() : undefined },
					timestamp: message.createdAt,
					footer: { text: `${starCount} ⭐` }
				}
			}).catch(null);

			starred[args.message.id] = {};
			starred[args.message.id].author = message.author.id;
			starred[args.message.id].starredMessageID = sentStar.id;
			starred[message.id].starredMessageContent = message.cleanContent;
			starred[message.id].starredMessageImage = attachmentImage || '';
			starred[message.id].starredMessageDate = message.createdAt;
			starred[args.message.id].count = starCount;
			starred[args.message.id].stars = [];
			starred[args.message.id].stars.push(msg.author.id);
			settings.starred = starred;

			await settings.save();
		}

		return msg.delete().catch(null);
	}
};

const { Command } = require('discord.js-commando');
const starBoard = require('../../postgreSQL/models/StarBoard');

module.exports = class UnstarCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'unstar',
			group: 'starboard',
			memberName: 'unstar',
			description: 'Unstars a message.',
			examples: ['unstar 189696688657530880'],

			args: [
				{
					key: 'message',
					prompt: 'what would you like to unstar?\n',
					type: 'message'
				}
			]
		});
	}

	async run(msg, args) {
		const message = args.message;

		const starboard = msg.guild.channels.find('name', 'starboard');
		if (!starboard) return msg.reply('can\'t unstar things without a #starboard channel. Create one now!');

		const settings = await starBoard.findOne({ where: { guildID: msg.guild.id } });
		if (!settings) {
			msg.reply('nobody\'s starred before!');
			return msg.delete().catch(null);
		}
		let starred = settings.starred;

		if (!starred.hasOwnProperty(message.id)) {
			msg.reply('this message isn\'t starred.');
			return msg.delete().catch(null);
		}
		if (!starred[message.id].stars.includes(msg.author.id)) {
			msg.reply('you can only unstar a message you have starred before!');
			return msg.delete().catch(null);
		}

		const starCount = starred[message.id].count -= 1;
		const starredMessage = await starboard.fetchMessage(starred[message.id].starredMessageID).catch(null);

		if (starred[message.id].count === 0) {
			delete starred[message.id];
			await starredMessage.delete().catch(null);
		} else {
			const starredMessageContent = starred[message.id].starredMessageContent;
			const starredMessageAttachmentImage = starred[message.id].starredMessageImage;
			const starredMessageDate = starred[message.id].starredMessageDate;
			const edit = starredMessage.embeds[0].footer.text.replace(`${starCount + 1} ⭐`, `${starCount} ⭐`);
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
			starred[message.id].stars.splice(starred[message.id].stars.indexOf(msg.author.id));
		}

		settings.starred = starred;
		await settings.save();

		return msg.delete().catch(null);
	}
};

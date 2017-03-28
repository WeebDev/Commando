const { Command } = require('discord.js-commando');

const starBoard = require('../../models/StarBoard');

module.exports = class ShowStarCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'show-star',
			group: 'starboard',
			memberName: 'show-star',
			description: 'Shows who starred a message.',
			examples: ['show-star 189696688657530880'],
			guildOnly: true,

			args: [
				{
					key: 'message',
					prompt: 'which message would you like to see the people who starred?\n',
					type: 'message'
				}
			]
		});
	}

	async run(msg, args) {
		const { message } = args;
		const starboard = msg.guild.channels.find('name', 'starboard');
		if (!starboard) return msg.reply('can\'t see stars without a #starboard channel. Create one now!');

		const settings = await starBoard.findOne({ where: { guildID: msg.guild.id } });
		if (!settings) {
			msg.reply('nobody\'s starred before!');
			return msg.delete().catch(err => null); // eslint-disable-line no-unused-vars, handle-callback-err
		}

		let starred = settings.starred;
		if (!starred.hasOwnProperty(message.id)) {
			msg.reply('this message isn\'t starred.');
			return msg.delete().catch(err => null); // eslint-disable-line no-unused-vars, handle-callback-err
		}

		const starCount = starred[message.id].count;
		const starredMessageDate = starred[message.id].starredMessageDate;
		let starText;

		if (starCount < 5) starText = `${starCount} ⭐`;
		else if (starCount >= 5 && starCount < 10) starText = `${starCount} 🌟`;
		else if (starCount >= 10) starText = `${starCount} ✨`;
		else if (starCount >= 15) starText = `${starCount} 🌠`;

		const starredUsers = [];
		for (const id of starred[message.id].stars) {
			const user = this.client.users.get(id);
			if (user) starredUsers.push(user);
		}

		return msg.embed({
			author: {
				icon_url: message.author.displayAvatarURL, // eslint-disable-line camelcase
				name: `${message.author.username}#${message.author.discriminator} (${message.author.id})`
			},
			color: 0xFFAC33,
			fields: [
				{
					name: 'Starred by:',
					value: starredUsers.join(', ')
				}
			],
			timestamp: starredMessageDate,
			footer: { text: starText }
		});
	}
};

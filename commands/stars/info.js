const { Command } = require('discord.js-commando');

const Starboard = require('../../structures/stars/Starboard');

module.exports = class StarInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'info-star',
			aliases: ['star-info', 'star-who', 'who-star'],
			group: 'stars',
			memberName: 'info',
			description: 'Add a message to the #starboard!',
			guildOnly: true,

			args: [
				{
					key: 'message',
					prompt: 'What message would you like to star?',
					type: 'message'
				}
			]
		});
	}

	async run(msg, args) {
		const { message } = args;
		const starboard = msg.guild.channels.find('name', 'starboard');
		if (!starboard) return msg.reply('you can\'t see stars if you don\'t even have a starboard.');

		const isStarred = await Starboard.isStarred(message.id);
		if (!isStarred) return msg.reply('that message is not on the #starboard.');

		const { starredBy } = await Starboard.getStar(message.id);

		return msg.embed({
			author: {
				icon_url: message.author.displayAvatarURL, // eslint-disable-line camelcase
				name: `${message.author.username}#${message.author.discriminator} (${message.author.id})`
			},
			color: 0xFFAC33,
			fields: [
				{
					name: 'Starred by:',
					value: starredBy.map(id => `<@${id}>`).join(', ')
				}
			]
		});
	}
};

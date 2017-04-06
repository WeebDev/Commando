const { Command } = require('discord.js-commando');

const Starboard = require('../../structures/stars/Starboard');

module.exports = class UnstarCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'unstar',
			group: 'stars',
			memberName: 'unstar',
			description: 'Remove your star from a message on the #starboard!',
			guildOnly: true,

			args: [
				{
					key: 'message',
					prompt: 'What message would you like to unstar?',
					type: 'message'
				}
			]
		});
	}

	async run(msg, args) { // eslint-disable-line consistent-return
		const { message } = args;
		const starboard = msg.guild.channels.find('name', 'starboard');
		if (!starboard) return msg.reply('you can\'t unstar things without a #starboard...');
		const hasStarred = await Starboard.hasStarred(message.id, msg.author.id);
		if (!hasStarred) return msg.reply('you never starred this message.');
		Starboard.removeStar(message, starboard, msg.author.id);
	}
};

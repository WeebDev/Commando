const { Command } = require('discord.js-commando');

const Starboard = require('../../structures/stars/Starboard');

module.exports = class DeleteStarCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'delete-star',
			aliases: ['star-delete', 'star-del', 'del-star'],
			group: 'stars',
			memberName: 'delete',
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

	hasPermission(msg) {
		return msg.member.roles.exists('name', 'Server Staff');
	}

	async run(msg, args) { // eslint-disable-line consistent-return
		const { message } = args;

		const starboard = msg.guild.channels.find('name', 'starboard');
		if (!starboard) return msg.reply('you can\'t delete stars if you don\'t even have a starboard.');

		const isStarred = await Starboard.isStarred(message.id);
		if (!isStarred) return msg.reply('that message is not on the #starboard.');

		await Starboard.removeStar(message, starboard);

		return msg.reply('successfully delete the message from the starboard');
	}
};

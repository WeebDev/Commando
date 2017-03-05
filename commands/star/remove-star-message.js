const { Command } = require('discord.js-commando');
const starBoard = require('../../postgreSQL/models/StarBoard');

module.exports = class RemoveStarMessageCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'remove-star-message',
			aliases: ['rmstar'],
			group: 'starboard',
			memberName: 'remove-star-message',
			description: 'Removes the starred message.',
			examples: ['remove-star 189696688657530880', 'rmstar 189696688657530880'],

			args: [
				{
					key: 'message',
					prompt: 'what message would you like to remove?\n',
					type: 'message'
				}
			]
		});
	}

	hasPermission(msg) {
		return msg.member.roles.exists('name', 'Server Staff');
	}

	async run(msg, args) {
		const message = args.message;

		const starboard = msg.guild.channels.find('name', 'starboard');
		if (!starboard) return msg.reply('can\'t unstar things without a #starboard channel. Create one now!');

		const settings = await starBoard.findOne({ where: { guildID: msg.guild.id } });
		if (!settings) return msg.reply('nobody\'s starred before!');
		let starred = settings.starred;

		if (!starred.hasOwnProperty(message.id)) return msg.reply('this message isn\'t starred.');

		const starredMessage = await starboard.fetchMessage(starred[message.id].starredMessageID).catch(null);

		delete starred[message.id];
		await starredMessage.delete().catch(null);

		settings.starred = starred;
		await settings.save();

		return msg.delete().catch(null);
	}
};

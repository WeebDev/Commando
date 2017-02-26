const { Command } = require('discord.js-commando');

module.exports = class UnstarCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'unstar',
			group: 'fun',
			memberName: 'unstar',
			description: 'Unstars a message.',
			examples: ['unstar 189696688657530880'],

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
		if (!msg.guild.channels.exists('name', 'starboard')) return;
		args.message.delete().catch(null);
		msg.delete().catch(null);
		return;
	}
};

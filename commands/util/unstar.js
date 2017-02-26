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
					default: null
				}
			]
		});
	}

	async run(msg, args) {
		if (!msg.guild.channels.exists('name', 'starboard') || this.client.users.get('219833449530261506').presence.status === 'online') return;
		args.message.delete().catch(null);
		msg.delete().catch(null);
		return;
	}
};

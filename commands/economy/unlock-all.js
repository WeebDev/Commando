const { Command } = require('discord.js-commando');
const Currency = require('../../currency/Currency.js');

module.exports = class UnlockAllCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'unlock-all',
			group: 'economy',
			memberName: 'unlock-all',
			description: `Enable xp and ${Currency.singular} earning on all channels in the server.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	hasPermission(msg) {
		return msg.member.hasPermission('MANAGE_GUILD');
	}

	async run(msg) {
		this.client.provider.set(msg.guild.id, 'locks', []);

		return msg.reply(`the lock on all channels has been lifted. You can now earn xp and ${Currency.plural} on the entire server.`);
	}
};

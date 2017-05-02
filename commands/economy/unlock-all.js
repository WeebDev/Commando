const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');

const Currency = require('../../structures/currency/Currency');

module.exports = class UnlockAllCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'unlock-all',
			group: 'economy',
			memberName: 'unlock-all',
			description: `Enable xp and ${Currency.textSingular} earning on all channels in the server.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	hasPermission(msg) {
		return this.client.isOwner(msg.author) || msg.member.hasPermission('MANAGE_GUILD');
	}

	run(msg) {
		this.client.provider.set(msg.guild.id, 'locks', []);
		return msg.reply(stripIndents`
			the lock on all channels has been lifted.
			You can now earn xp and ${Currency.textPlural} on the entire server again.
		`);
	}
};

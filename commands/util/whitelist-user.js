const { Command } = require('discord.js-commando');

module.exports = class WhitelistUserCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'whitelist-user',
			aliases: ['whitelist'],
			group: 'util',
			memberName: 'whitelist-user',
			description: 'Remove a user from the blacklist',
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'user',
					prompt: 'what user should get removed from the blacklist?\n',
					type: 'user'
				}
			]
		});
	}

	hasPermission(msg) {
		return this.client.isOwner(msg.author);
	}

	run(msg, { user }) {
		const blacklist = this.client.provider.get('global', 'userBlacklist', []);
		if (!blacklist.includes(user.id)) return msg.reply('that user is not blacklisted.');

		const index = blacklist.indexOf(user.id);
		blacklist.splice(index, 1);

		if (blacklist.length === 0) this.client.provider.remove('global', 'userBlacklist');
		else this.client.provider.set('global', 'userBlacklist', blacklist);

		return msg.reply(`${user.tag} has been removed from the blacklist.`);
	}
};

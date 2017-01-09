const { Command } = require('discord.js-commando');

module.exports = class BlacklistUserCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'blacklist-user',
			aliases: ['blacklist'],
			group: 'util',
			memberName: 'blacklist-user',
			description: 'Prohibit a user from using commando',
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'user',
					prompt: 'what user should get blacklisted?\n',
					type: 'user'
				}
			]
		});
	}

	hasPermission(msg) {
		return this.client.options.owner === msg.author.id;
	}

	async run(msg, args) {
		const user = args.user;

		if (this.client.options.owner === user.id) return msg.reply('the bot owner can not be blacklisted.');

		const blacklist = this.client.provider.get('global', 'userBlacklist', []);
		if (blacklist.includes(user.id)) return msg.reply('that user is already blacklisted.');

		blacklist.push(user.id);
		this.client.provider.set('global', 'userBlacklist', blacklist);

		return msg.reply(`${user.username}#${user.discriminator} has been blacklisted from using ${this.client.user}.`);
	}
};

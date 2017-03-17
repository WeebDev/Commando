const { Command } = require('discord.js-commando');

module.exports = class CleanCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'clean',
			aliases: ['purge', 'prune', 'clear'],
			group: 'util',
			memberName: 'clean',
			description: 'Deletes messages.',
			details: `Deletes messages. Here is a list of filters:
				__invites:__ Messages containing an invite
				__user @user:__ Messages sent by @user
				__bots:__ Messages sent by bots
				__you:__ Messages sent by Commando
				__uploads:__ Messages containing an attachment
				__links:__ Messages containing a link`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'limit',
					prompt: 'how many messages would you like to delete?\n',
					type: 'integer',
					max: 100
				},
				{
					key: 'filter',
					prompt: 'what filter would you like to apply?\n',
					type: 'string',
					default: ''
				},
				{
					key: 'member',
					prompt: 'whose messages would you like to delete?\n',
					type: 'member',
					default: ''
				}
			]
		});
	}

	hasPermission(msg) {
		return this.client.isOwner(msg.author) || msg.member.roles.exists('name', 'Server Staff');
	}

	async run(msg, args) { // eslint-disable-line consistent-return
		const { limit } = args;
		const filter = args.filter.toLowerCase();
		let messageFilter;

		if (filter) {
			if (filter === 'invite') {
				messageFilter = message => message.content.search(/(discord\.gg\/.+|discordapp\.com\/invite\/.+)/i)
				!== -1;
			} else if (filter === 'user') {
				if (args.member) {
					const member = args.member;
					const user = member.user;
					messageFilter = message => message.author.id === user.id;
				} else {
					return msg.say(`${msg.author}, you have to mention someone.`);
				}
			} else if (filter === 'bots') {
				messageFilter = message => message.author.bot;
			} else if (filter === 'you') {
				messageFilter = message => message.author.id === message.client.user.id;
			} else if (filter === 'upload') {
				messageFilter = message => message.attachments.size !== 0;
			} else if (filter === 'links') {
				messageFilter = message => message.content.search(/https?:\/\/[^ \/\.]+\.[^ \/\.]+/) !== -1; // eslint-disable-line
			} else {
				return msg.say(`${msg.author}, this is not a valid filter. \`help clean\` for all available filters.`);
			}
		}

		/* eslint-disable no-unused-vars, handle-callback-err */
		if (!filter) {
			const messagesToDelete = await msg.channel.fetchMessages({ limit: limit }).catch(err => null);
			msg.channel.bulkDelete(messagesToDelete.array().reverse()).catch(err => null);
		} else {
			const messages = await msg.channel.fetchMessages({ limit: limit }).catch(err => null);
			const messagesToDelete = messages.filter(messageFilter);
			msg.channel.bulkDelete(messagesToDelete.array().reverse()).catch(err => null);
		}
	}
};

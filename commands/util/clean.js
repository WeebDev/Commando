const { Command } = require('discord.js-commando');
const winston = require('winston');

module.exports = class CleanCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'clean',
			aliases: ['purge', 'prune'],
			group: 'util',
			memberName: 'clean',
			description: 'Deletes messages.',
			format: '<number> [[filter] [argument]]',
			details: `Deletes messages. Here is a list of filters:
				__invites:__ Messages containing an invite
				__user @user:__ Messages sent by @user
				__bots:__ Messages sent by bots
				__uploads:__ Messages containing an attachment
				__links:__ Messages containing a link`,
			guildOnly: true,
			argsType: 'multiple',
			argsCount: 3,

			args: [
				{
					key: 'limit',
					prompt: 'How many messages would you like to delete?\n',
					type: 'integer',
					max: 100
				},
				{
					key: 'filter',
					prompt: 'What filter would you like to apply?\n',
					type: 'string',
					default: ''
				},
				{
					key: 'member',
					prompt: 'Whose messages would you like to delete?\n',
					type: 'member',
					default: ''
				}
			]
		});
	}

	async run(msg, args) {
		if (!msg.member.hasPermission('MANAGE_MESSAGES')) {
			return msg.say(`${msg.author}, don't set me up on stuff you can't even do yourself!`);
		}
		if (!args.limit) {
			return msg.say(`${msg.author}, atleast provide me with a number!`);
		}

		const limit = args.limit;
		const filter = args.filter;
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
				messageFilter = message => message.content.search(/https?:\/\/[^ \/\.]+\.[^ \/\.]+/) !== -1; // eslint-disable-line no-useless-escape
			} else {
				return msg.say(`${msg.author}, this is not a valid filter. \`help clean\` for all available filters.`);
			}
		}

		if (!filter) {
			return msg.channel.fetchMessages({ limit: limit })
			.then(messagesToDelete => {
				msg.channel.bulkDelete(messagesToDelete.array().reverse()).catch(error => { winston.error(error); });
			})
			.then(() => {
				msg.say(`I cleaned up the number of messages you requested, ${msg.author}.`)
					.then(sentMessage => { sentMessage.delete(4000); });
			})
			.catch(error => { winston.error(error); });
		}
		return msg.channel.fetchMessages({ limit: limit })
			.then(messages => {
				let messagesToDelete = messages.filter(messageFilter);
				msg.channel.bulkDelete(messagesToDelete).catch(error => { winston.error(error); });
			})
			.then(() => {
				msg.say(`I cleaned up the number of messages you requested, ${msg.author}.`)
					.then(sentMessage => { sentMessage.delete(4000); });
			})
			.catch(error => { winston.error(error); });
	}
};

process.on('unhandledRejection', err => { winston.error(`Uncaught Promise Error: \n${err.stack}`); });

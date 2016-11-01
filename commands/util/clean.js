/* eslint-disable no-console */
const { Command } = require('discord.js-commando');

module.exports = class CleanCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'clean',
			aliases: ['purge', 'prune'],
			group: 'util',
			memberName: 'clean',
			description: 'Deletes messages.',
			format: '<number> [[filter] [argument]]',
			details: `Deletes msgs. Here is a list of filters:
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
					key: 'number',
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

	hasPermission(msg) {
		return msg.author.id === this.client.options.owner;
	}

	async run(msg, args) {
		if (msg.author.id !== '81440962496172032') {
			return msg.say(`${msg.author}, don't set me up on stuff you can't even do yourself!`);
		}
		if (!args.number) {
			return msg.say(`${msg.author}, atleast provide me with a number!`);
		}

		let filter;
		if (args.filter) {
			if (args.filter === 'invite') {
				filter = message => message.content.search(/(discord\.gg\/.+|discordapp\.com\/invite\/.+)/i) !== -1;
			} else if (args.filter === 'user') {
				if (args.member) {
					const member = args.member;
					const user = member.user;
					filter = message => message.author.id === user.id;
				} else {
					return msg.say(`${msg.author}, you have to mention someone.`);
				}
			} else if (args.filter === 'bots') {
				filter = message => message.author.bot;
			} else if (args.filter === 'you') {
				filter = message => message.author.id === message.client.user.id;
			} else if (args.filter === 'upload') {
				filter = message => message.attachments.size !== 0;
			} else if (args.filter === 'links') {
				filter = message => message.content.search(/https?:\/\/[^ \/\.]+\.[^ \/\.]+/) !== -1;
			} else {
				return msg.say(`${msg.author}, that is not a valid filter. Do \`help clean\` for all available filters.`);
			}
		}

		if (!args.filter) {
			return msg.channel.fetchMessages({ limit: args.limit, before: msg.id })
			.then(messagesToDelete => {
				msg.channel.bulkDelete(messagesToDelete).catch(error => console.log(error));
			})
			.then(() => {
				msg.say(`I cleaned up the number of messages you requested, ${msg.author}.`)
				.then(sentMessage => {
					sentMessage.delete(4000);
				});
			})
			.catch(error => {
				console.log(error);
			});
		}
		return msg.channel.fetchMessages({ limit: args.limit, before: msg.id })
			.then(messages => {
				let messageFilter = messages.filter(filter);
				msg.channel.bulkDelete(messageFilter).catch(error => console.log(error));
			})
			.then(() => {
				msg.say(`I cleaned up the number of messages you requested, ${msg.author}.`)
					.then(sentMessage => {
						sentMessage.delete(4000);
					});
			})
			.catch(error => {
				console.log(error);
			});
	}
};

process.on('unhandledRejection', err => {
	console.error(`Uncaught Promise Error: \n${err.stack}`);
});

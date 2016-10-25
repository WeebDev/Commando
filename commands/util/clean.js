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
			format: '<number> [<filter> <argument>]',
			details: `Deletes msgs. Here is a list of filters:
				__text ...:__ Messages containing the following text
				__invites:__ Messages containing an invite
				__user @user:__ Messages sent by @user
				__bots:__ Messages sent by bots
				__uploads:__ Messages containing an attachment
				__links:__ Messages containing a link
				__length #:__ Messages longer than the specified length`,
			examples: ['clean 10', 'clean 20 text test', 'clean 10 invites', 'clean 50 user @Crawl#3280', 'clean 10 bots', 'clean 20 uploads', 'clean 100 links', 'clean 50 length 10'],
			guildOnly: true,
			argsType: 'multiple',
			argsCount: 3
		});
	}

	hasPermission(msg) {
		return msg.author.id === this.client.options.owner;
	}

	async run(msg, args) {
		if (msg.author.id !== '81440962496172032') {
			return msg.say(`${msg.author}, don't set me up on stuff you can't even do yourself!`);
		}
		if (!args[0] || isNaN(args[0])) {
			return msg.say(`${msg.author}, atleast provide me with a number!`);
		}

		let limit = 100;
		let filter = null;
		if (/^[1-9]+/.test(args[0])) {
			console.log(args[0]);
			limit = parseInt(args[0]) + 1;
			console.log(limit);
			if (limit > 100) {
				limit = 100;
			}
		}

		if (args[1]) {
			if (/^text/.test(args[1])) {
				filter = message => message.content.includes(args[2]);
			} else if (args[1] === 'invite') {
				filter = message => message.content.search(/(discord\.gg\/.+|discordapp\.com\/invite\/.+)/i) !== -1;
			} else if (args[1] === 'user') {
				if (args[2]) {
					filter = message => message.author.id === args[2].replace(/<|!|>|@/g, '');
				} else {
					return msg.say(`${msg.author}, you have to mention someone.`);
				}
			} else if (args[1] === 'bots') {
				filter = message => message.author.bot === true;
			} else if (args[1] === 'you') {
				filter = message => message.author.id === message.client.user.id;
			} else if (args[1] === 'upload') {
				filter = message => message.attachments.size !== 0;
			} else if (args[1] === 'links') {
				filter = message => message.content.search(/https?:\/\/[^ \/\.]+\.[^ \/\.]+/) !== -1;
			} else if (args[1] === 'length' && /\d+/.test(args[2])) {
				let max = parseInt(args[2]);
				filter = message => message.content.length > max;
			} else {
				return msg.say(`${msg.author}, that is not a valid filter. Do \`help clean\` for all available filters.`);
			}
		}

		if (!args[1]) {
			return msg.channel.fetchMessages({ limit: limit })
			.then(messagesToDelete => {
				msg.channel.bulkDelete(messagesToDelete);
			})
			.then(() => {
				msg.say(`I cleaned up the number of messages you requested, ${msg.author}.`)
				.then(sentMessage => {
					sentMessage.delete(4000);
				});
			})
			.catch(error => {
				console.log(error);
				msg.say(`${msg.author}, I got an error over here: ${error}`);
			});
		}
		return msg.channel.fetchMessages({ limit: limit })
			.then(messages => {
				let messageFilter = messages.filter(filter);
				msg.channel.bulkDelete(messageFilter);
			})
			.then(() => {
				msg.say(`I cleaned up the number of messages you requested, ${msg.author}.`)
					.then(sentMessage => {
						sentMessage.delete(4000);
					});
			})
			.catch(error => {
				console.log(error);
				msg.say(`${msg.author}, I got an error over here: ${error}`);
			});
	}
};

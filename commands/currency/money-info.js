const { Command } = require('discord.js-commando');
const Redis = require('../../redis/Redis');

const redis = new Redis();

module.exports = class MoneyInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'money',
			aliases: ['donut'],
			group: 'currency',
			memberName: 'money-info',
			description: 'Displays the money you have earned.',
			details: 'Display the amount of money you have earned.',

			args: [
				{
					key: 'member',
					prompt: 'What user\'s earning do you want to view?',
					type: 'member',
					default: ''
				}
			]
		});
	}

	async run(msg, args) {
		let user = args.member || msg.author;

		redis.db.getAsync(`money${user.id}`).then(balance => {
			if (args.member) {
				if (!balance) return msg.reply(`${args.member.displayName} hasn't earned any 🍩's yet :(`);
				return msg.reply(`${args.member.displayName} has earned ${balance} 🍩's so far. Good on them!`);
			} else {
				if (!balance) return msg.reply('you haven\'t earned any 🍩\'s yet, sorry :(');
				return msg.reply(`You have earned ${balance} 🍩's so far. Good on you!`);
			}
		});
	}
};

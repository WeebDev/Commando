const { Command } = require('discord.js-commando');
const Redis = require('../../redis/Redis');

const redis = new Redis();

module.exports = class MoneyCheckCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'money',
			group: 'info',
			memberName: 'money',
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

		redis.db.getAsync(user.id).then(balance => {
			if (args.member) {
				if (!balance) return msg.reply(`${args.member.displayName} hasn't earned any money yet :(`);
				return msg.reply(`${args.member.displayName} has earned ${balance}Đ so far. Good on them!`);
			} else {
				if (!balance) return msg.reply('you haven\'t earned any money yet, sorry :(');
				return msg.reply(`You have earned ${balance}Đ so far. Good on you!`);
			}
		});
	}
};

const { Command } = require('discord.js-commando');
const Money = require('../../postgreSQL/models/Money');

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

		return Money.findOne({ where: { userID: user.id } }).then(row => {
			if (args.member) {
				if (!row) return msg.reply(`${args.member.displayName} hasn't earned any money yet! :(`);
				return msg.reply(`${args.member.displayName} has earned ${row.money}Đ so far. Good on them!`);
			} else {
				if (!row) return msg.reply('you haven\'t earned any money yet!');
				return msg.reply(`You have earned ${row.money}Đ so far. Good on you!`);
			}
		});
	}
};

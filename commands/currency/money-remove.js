const { Command } = require('discord.js-commando');

const Money = require('../../postgreSQL/models/Money');
const Redis = require('../../redis/Redis');

const redis = new Redis();

module.exports = class MoneyRemoveCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'remove-money',
			aliases: ['remove-donut', 'remove-donuts', 'money-remove', 'donut-remove', 'donuts-remove'],
			group: 'currency',
			memberName: 'remove',
			description: 'Displays the money you have earned.',
			details: 'Display the amount of money you have earned.',

			args: [
				{
					key: 'member',
					prompt: 'What user would you like to remove donuts?',
					type: 'member'
				},
				{
					key: 'donuts',
					prompt: 'How many donuts do you want to remove from that user?',
					type: 'integer'
				}
			]
		});
	}

	hasPermission(msg) {
		return msg.author.id === this.client.options.owner;
	}

	async run(msg, args) {
		const user = args.member;
		const donuts = args.donuts;

		return Money.findOne({ where: { userID: user.id } }).then(member => {
			if (!member) {
				return msg.say('Fek u no user.');
			} else {
				member.decrement('money', { by: donuts });
				member.save();
				return redis.db.getAsync(`money${user.id}`).then(balance => {
					redis.db.setAsync(`money${user.id}`, parseInt(balance) - donuts);
				});
			}
		});
	}
};

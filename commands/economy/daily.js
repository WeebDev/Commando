const { Command } = require('discord.js-commando');
const moment = require('moment');
const stripIndents = require('common-tags').stripIndents;

const Daily = require('../../currency/Daily');

module.exports = class DailyCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'daily',
			group: 'economy',
			memberName: 'daily',
			description: 'Receive your daily donuts.',
			details: 'Receive your daily donuts.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'member',
					prompt: 'to which user would you like to give your daily?\n',
					type: 'member',
					default: ''
				}
			]
		});
	}

	async run(msg, args) {
		const received = await Daily.received(msg.author.id);
		const user = args.member;

		if (user.id === msg.author.id) {
			return msg.reply(stripIndents`
				you can't donate the daily to yourself.
				You have been given the normal ${Daily.dailyPayout} 🍩s.
			`);
		}

		if (received) {
			const nextDaily = await Daily.nextDaily(msg.author.id);
			return msg.reply(stripIndents`
				you have already received/given your daily donuts.
				You can receive/give your next daily in ${moment.duration(nextDaily).format('hh [hours] mm [minutes]')}
			`);
		}

		if (user.id !== msg.author.id) {
			Daily.receive(msg.author.id, user.id);

			return msg.reply(`${user} has successfully received your daily ${Daily.dailyDonationPayout} 🍩s.`);
		}

		Daily.receive(msg.author.id);

		return msg.reply(`You have successfully received your daily ${Daily.dailyPayout} 🍩s.`);
	}
};

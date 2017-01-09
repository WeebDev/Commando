const { Command } = require('discord.js-commando');
const moment = require('moment');
const stripIndents = require('common-tags').stripIndents;

const Daily = require('../../currency/Daily');

const dailies = {
	normal: 210,
	donation: 300
};

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

		if (received) {
			const nextDaily = await Daily.nextDaily(msg.author.id);
			return msg.reply(stripIndents`
				you have already received/given your daily donuts.
				You can receive your next daily in ${moment.duration(nextDaily).format('hh [hours] mm [minutes]')}
			`);
		}

		if (user) {
			Daily.receive(msg.author.id, dailies.donation, user.id);

			return msg.reply(`${user} has successfully received your daily ${dailies.normal} 🍩s.`);
		}

		Daily.receive(msg.author.id, dailies.normal);

		return msg.reply(`You have successfully received your daily ${dailies.normal} 🍩s.`);
	}
};

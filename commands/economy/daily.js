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
			}
		});
	}

	async run(msg) {
		const received = await Daily.received(msg.author.id);

		if (received) {
			const nextDaily = await Daily.nextDaily(msg.author.id);
			return msg.reply(stripIndents`
				you have already received your daily donuts.
				You can receive your next daily in ${moment.duration(nextDaily).format('hh [hours] mm [minutes]')}
			`);
		}

		Daily.receive(msg.author.id);

		return msg.reply(`You have successfully received your daily ${Daily.dailyDonuts} 🍩s.`);
	}
};


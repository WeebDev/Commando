const { Command } = require('discord.js-commando');
const moment = require('moment');

const Daily = require('../../currency/Daily');

module.exports = class DailyCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'daily',
			group: 'currency',
			memberName: 'daily',
			description: 'Receive your daily donuts.',
			details: 'Receive your daily donuts.'
		});
	}

	async run(msg) {
		const received = await Daily.received(msg.author.id);

		if (received) {
			const nextDaily = await Daily.nextDaily(msg.author.id);
			return msg.reply(`You have already received your daily donuts. You can receive your next daily in ${moment.duration(nextDaily).format('hh [Hours] mm [Minutes]')}`);
		}

		Daily.receive(msg.author.id);
		return msg.reply(`You have successfully received your daily ${Daily.dailyDonuts} 🍩s.`);
	}
};


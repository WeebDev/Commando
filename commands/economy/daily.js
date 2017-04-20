const { Command } = require('discord.js-commando');
const moment = require('moment');
const { stripIndents } = require('common-tags');

const Currency = require('../../structures/currency/Currency');
const Daily = require('../../structures/currency/Daily');

module.exports = class DailyCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'daily',
			group: 'economy',
			memberName: 'daily',
			description: `Receive or gift your daily ${Currency.textPlural}.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'member',
					prompt: 'whom do you want to give your daily?\n',
					type: 'member',
					default: ''
				}
			]
		});
	}

	async run(msg, args) {
		const member = args.member || msg.member;
		const received = await Daily.received(msg.author.id);
		if (received) {
			const nextDaily = await Daily.nextDaily(msg.author.id);
			return msg.reply(stripIndents`
				you have already received your daily ${Currency.textPlural}.
				You can receive your next daily in ${moment.duration(nextDaily).format('hh [hours] mm [minutes]')}
			`);
		}

		if (member.id !== msg.author.id) {
			Daily.receive(msg.author.id, member.id);
			return msg.reply(
				`${member} has successfully received your daily ${Currency.convert(Daily.dailyDonationPayout)}.`
			);
		}

		Daily.receive(msg.author.id);

		return msg.reply(`You have successfully received your daily ${Currency.convert(Daily.dailyPayout)}.`);
	}
};

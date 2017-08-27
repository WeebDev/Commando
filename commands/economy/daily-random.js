const { Command } = require('discord.js-commando');
const moment = require('moment');
const { oneLine, stripIndents } = require('common-tags');

const Currency = require('../../structures/currency/Currency');
const Daily = require('../../structures/currency/Daily');

module.exports = class DailyRandomCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'daily-random',
			aliases: ['daily-ran', 'daily-rng'],
			group: 'economy',
			memberName: 'daily-random',
			description: `Gift your daily ${Currency.textPlural} to a random online user.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	async run(msg) {
		const guild = await msg.guild.members.fetch();
		const member = guild.members.filter(mem => mem.presence.status === 'online' && !mem.user.bot).random();
		const received = await Daily.received(msg.author.id);

		if (received) {
			const nextDaily = await Daily.nextDaily(msg.author.id);
			return msg.reply(stripIndents`
				you have already gifted your daily ${Currency.textPlural}.
				You can gift away your next daily in ${moment.duration(nextDaily).format('hh [hours] mm [minutes]')}
			`);
		}

		Daily.receive(msg.author.id, member.id);

		return msg.reply(oneLine`
			${member.user.tag} (${member.id}) has successfully received your daily
			${Currency.convert(Daily.dailyDonationPayout)}.
		`);
	}
};

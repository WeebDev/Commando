const { Command } = require('discord.js-commando');
const moment = require('moment');
const { oneLine, stripIndents } = require('common-tags');

const Currency = require('../../structures/currency/Currency');
const Daily = require('../../structures/currency/Daily');

module.exports = class DailyRandomCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'daily-random',
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
		const received = await Daily.received(msg.author.id);
		const guild = await msg.guild.fetchMembers();
		const member = guild.members.filter(mem => mem.presence.status === 'online' && !mem.user.bot).random();

		if (received) {
			const nextDaily = await Daily.nextDaily(msg.author.id);
			return msg.reply(stripIndents`
				you have already received your daily ${Currency.textPlural}.
				You can receive your next daily in ${moment.duration(nextDaily).format('hh [hours] mm [minutes]')}
			`);
		}

		if (member.id !== msg.author.id) {
			Daily.receive(msg.author.id, member.id);
			return msg.reply(oneLine`
				${member.displayName}#${member.user.discriminator} (${member.id}) has successfully received your daily
				${Currency.convert(Daily.dailyDonationPayout)}.
			`);
		}

		Daily.receive(msg.author.id);
		return msg.reply(`You have successfully received your daily ${Currency.convert(Daily.dailyPayout)}.`);
	}
};

const { Command } = require('discord.js-commando');
const moment = require('moment');
const sherlock = require('Sherlock');
const { stripIndents } = require('common-tags');

const Util = require('../../util/Util');

module.exports = class RemindMeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'remindme',
			aliases: ['remind'],
			group: 'util',
			memberName: 'remindme',
			description: 'Reminds you of something.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'remind',
					label: 'reminder',
					prompt: 'what would you like me to remind you about?\n',
					type: 'string',
					validate: time => {
						const remindTime = sherlock.parse(time);
						if (!remindTime.startDate) return `please provide a valid starting time.`;

						return true;
					},
					parse: time => sherlock.parse(time)
				}
			]
		});
	}

	async run(msg, { remind }) {
		const time = remind.startDate.getTime() - Date.now();
		const preRemind = await msg.say(stripIndents`
			I will remind you '${Util.cleanContent(msg, remind.eventTitle)}' ${moment().add(time, 'ms').fromNow()}.
		`);
		const remindMessage = await new Promise(resolve => {
			setTimeout(() => resolve(msg.say(stripIndents`
				${msg.author} you wanted me to remind you of: '${Util.cleanContent(msg, remind.eventTitle)}'
			`)), time);
		});

		return [preRemind, remindMessage];
	}
};

const { Command } = require('discord.js-commando');
const moment = require('moment');
const sherlock = require('Sherlock');

module.exports = class RemindMeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'remindme',
			aliases: ['remind'],
			group: 'util',
			memberName: 'remindme',
			description: 'Reminds you of something.',
			guildOnly: true,

			args: [
				{
					key: 'remind',
					prompt: '\n',
					type: 'string',
					default: ''
				}
			]
		});
	}

	async run(msg, args) {
		const remind = args.remind;

		const remindTime = sherlock.parse(remind);
		const time = remindTime.startDate.getTime() - Date.now();

		const preRemind = await msg.say(`I will remind you '${remindTime.eventTitle}' ${moment().add(time, 'ms').fromNow()}.`);
		const remindMessage = await new Promise(resolve => {
			setTimeout(() => resolve(msg.say(`${msg.author} you wanted me to remind you of: '${remindTime.eventTitle}'`)), time);
		});

		return [preRemind, remindMessage];
	}
};

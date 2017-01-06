const { Command } = require('discord.js-commando');
const request = require('request-promise');
const stripIndents = require('common-tags').stripIndents;

const version = require('../../package').version;

module.exports = class FortuneCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'strawpoll',
			group: 'util',
			memberName: 'strawpoll',
			description: 'Create a strawpoll.',
			details: stripIndents`Create a strawpoll.
				The first argument is always the title, if you provde it, otherwise your username will be used!
				If you need to use spaces in your title make sure you put them in SingleQuotes => \`'topic here'\``,

			args: [
				{
					key: 'title',
					prompt: 'What title would you like the strawpoll to have?\n',
					type: 'string',
					max: 200
				},
				{
					key: 'options',
					prompt: 'What options would you like the strawpoll to have?\n',
					type: 'string',
					max: 160,
					infinite: true
				}
			]
		});
	}

	async run(msg, args) {
		const title = args.title;
		const options = args.options;

		if (options.length < 3) return msg.reply('please provide 3 or more options.');
		if (options.length > 31) return msg.reply('please provide less than 31 options.');

		const response = await request({
			method: 'POST',
			uri: `https://strawpoll.me/api/v2/polls`,
			followAllRedirects: true,
			headers: { 'User-Agent': `Hamakaze v${version} (https://github.com/WeebDev/Hamakaze/)` },
			body: {
				title: title,
				options: options,
				captcha: true
			},
			json: true
		});

		return msg.say(stripIndents`🗳 ${response.title}
			<http://strawpoll.me/${response.id}>
		`);
	}
};

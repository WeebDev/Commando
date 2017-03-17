const { Command } = require('discord.js-commando');
const request = require('request-promise');

const { version } = require('../../package');

module.exports = class TranslateCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'translate',
			aliases: ['t'],
			group: 'util',
			memberName: 'translate',
			description: 'Translates the input text into the specified output language.',
			throttling: {
				usages: 5,
				duration: 60
			},

			args: [
				{
					key: 'query',
					prompt: 'what text do you want to translate?\n',
					type: 'string'
				},
				{
					key: 'to',
					prompt: 'what language would you want to translate to?\n',
					type: 'string'
				},
				{
					key: 'from',
					prompt: 'what language would you want to translate from?\n',
					type: 'string',
					default: ''
				}
			]
		});
	}

	async run(msg, args) {
		const query = encodeURIComponent(args.query);
		const { to, from } = args;
		const response = await request({
			uri: `https://api.kurisubrooks.com/api/translate?to=${to}&from=${from}&query=${query}`,
			headers: { 'User-Agent': `Commando v${version} (https://github.com/WeebDev/Commando/)` },
			json: true
		});

		if (!response.ok) return msg.reply(this.handleError(response));
		const embed = {
			author: {
				name: msg.member ? msg.member.displayName : msg.author.username,
				icon_url: msg.author.avatarURL // eslint-disable-line camelcase
			},
			fields: [
				{
					name: response.from.name,
					value: response.query
				},
				{
					name: response.to.name,
					value: response.result
				}
			]
		};
		return msg.embed(embed);
	}

	handleError(response) {
		if (response.error === `unknown language in 'to' field`) {
			return `Unknown 'to' Language`;
		} else if (response.error === `unknown language in 'from' field`) {
			return `Unknown 'from' Language`;
		} else {
			return 'Internal Server Error';
		}
	}
};

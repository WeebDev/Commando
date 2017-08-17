const { Command } = require('discord.js-commando');
const request = require('request-promise');

const { SHERLOCK_API } = process.env;
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

	async run(msg, { query, to, from }) {
		if (!SHERLOCK_API) return msg.reply('my Commander has not set the Sherlock API Key. Go yell at him.');

		let response;
		try {
			response = await request({
				method: 'POST',
				headers: {
					'User-Agent': `Commando v${version} (https://github.com/WeebDev/Commando/)`,
					Authorization: SHERLOCK_API
				},
				uri: `https://api.kurisubrooks.com/api/translate`,
				body: { to, from, query },
				json: true
			});
		} catch (error) {
			if (error.error) return msg.reply(this.handleError(error.error));
		}

		return msg.embed({
			author: {
				name: msg.member ? msg.member.displayName : msg.author.username,
				icon_url: msg.author.displayAvatarURL({ format: 'png' }) // eslint-disable-line camelcase
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
		});
	}

	handleError(response) {
		if (response.error === 'Missing \'query\' field' || response.error === 'Missing \'to\' lang field') {
			return 'Required Fields are missing!';
		} else if (response.error === 'Unknown \'to\' Language') {
			return 'Unknown \'to\' Language.';
		} else if (response.error === 'Unknown \'from\' Language') {
			return 'Unknown \'from\' Language.';
		} else {
			return 'Internal Server Error.';
		}
	}
};

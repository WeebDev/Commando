const { Command } = require('discord.js-commando');
const moment = require('moment');
const nani = require('nani');
const winston = require('winston');

const config = require('../../settings');

const seasons = {
	1: 'Winter',
	2: 'Spring',
	3: 'Summer',
	4: 'Fall'
};

module.exports = class AnimeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'anime',
			aliases: ['animu'],
			group: 'fun',
			memberName: 'anime',
			description: 'Get info on an anime.',
			format: '<anime>',
			guildOnly: true,

			args: [
				{
					key: 'anime',
					prompt: 'What anime would you like to look up?\n',
					type: 'string'
				}
			]
		});

		nani.init(config.AniListID, config.AniListSecret);
	}

	async run(msg, args) { // eslint-disable-line consistent-return
		const anime = args.anime;
		// Because human interaction kek
		msg.channel.startTyping();
		try {
			let data = await nani.get(`anime/search/${anime}`);
			if (!Array.isArray(data)) {
				msg.channel.stopTyping();
				return msg.say(data.error.messages[0]);
			}
			data = data.length === 1 ? data[0] : data.find(en => en.title_english.toLowerCase() === anime.toLowerCase() || en.title_romaji.toLowerCase() === anime.toLowerCase()) || data[0];
			let title = data.title_english !== '' && data.title_romaji !== data.title_english ? `${data.title_english} / ${data.title_romaji} / ${data.title_japanese}` : `${data.title_romaji} / ${data.title_japanese}`;
			let synopsis = data.description.replace(/\\n/g, '\n').replace(/<br>|\\r/g, '').substring(0, 1050);
			let score = data.average_score / 10;

			// It would be horrible if she wouldn't stop typing
			msg.channel.stopTyping();

			let embed = {
				color: 3447003,
				author: {
					name: title,
					url: `http://www.anilist.co/anime/${data.id}`,
					icon_url: `${data.image_url_med}` // eslint-disable-line camelcase
				},
				fields: [
					{
						name: 'Type',
						value: `${data.type}\n${data.season !== null ? this.parseSeason(data.season) : '?'}\n${data.source !== null ? data.source : '?'}`,
						inline: true
					},
					{
						name: 'Episodes',
						value: `${data.total_episodes}`,
						inline: true
					},
					{
						name: 'Status',
						value: `${data.airing_status.replace(/(\b\w)/gi, lc => lc.toUpperCase())}`,
						inline: true
					},
					{
						name: 'Genre(s)',
						value: `${data.genres.join(', ')}`,
						inline: true
					},
					{
						name: 'Episode length',
						value: `${data.duration !== null ? data.duration : '?'} mins/ep`,
						inline: true
					},
					{
						name: 'Score',
						value: `${score.toFixed(2)}`,
						inline: true
					},
					{
						name: 'Description:',
						value: `${synopsis}`,
						inline: false
					}
				],
				footer: {
					icon_url: msg.client.user.avatarURL, // eslint-disable-line camelcase
					text: `Started: ${moment.utc(data.start_date).format('DD/MM/YYYY')}\nFinished: ${data.end_date !== null ? moment.utc(data.end_date).format('DD/MM/YYYY') : '?'}`
				}
			};

			return msg.channel.sendMessage('', { embed });
		} catch (error) {
			msg.channel.stopTyping();
			winston.error(error);
		}
	}

	parseSeason(season) {
		return season < 350 ? `${seasons[season % 10]} 20${Math.floor(season / 10)}` : `${seasons[season % 10]} 19${Math.floor(season / 10)}`;
	}
};

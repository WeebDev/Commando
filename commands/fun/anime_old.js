const { Command } = require('discord.js-commando');
const moment = require('moment');
const nani = require('nani');
const stripIndents = require('common-tags').stripIndents;
const winston = require('winston');

const config = require('../../settings');

const seasons = {
	1: 'Winter',
	2: 'Spring',
	3: 'Summer',
	4: 'Fall'
};

module.exports = class AnimeOldCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'anime-old',
			aliases: ['animu-old'],
			group: 'fun',
			memberName: 'anime-old',
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
			let title = data.title_english !== '' && data.title_romaji !== data.title_english ? `**${data.title_english}** / **${data.title_romaji}** / **${data.title_japanese}**` : `**${data.title_romaji}** / **${data.title_japanese}**`;
			let synopsis = data.description.replace(/\\n/g, '\n').replace(/<br>|\\r/g, '').substring(0, 500);
			let score = data.average_score / 10;

			// It would be horrible if she wouldn't stop typing
			msg.channel.stopTyping();

			return msg.say(stripIndents`
				${title}

				${data.type}  •  ${data.total_episodes} eps  •  ${data.airing_status.replace(/(\b\w)/gi, lc => lc.toUpperCase())} (${moment.utc(data.start_date).format('MMM DD, YYYY')} - ${data.end_date !== null ? moment.utc(data.end_date).format('MMM DD, YYYY') : '?'})  •  ${data.duration !== null ? data.duration : '?'} mins/ep
				Source: ${data.source !== null ? data.source : '?'}  •  Season: ${data.season !== null ? this.parseSeason(data.season) : '?'}  •  Scored ${score.toFixed(2)}
				Genres: ${data.genres.join(', ')}  •  <http://www.anilist.co/anime/${data.id}>

				**Description:**
				${synopsis}
			`);
		} catch (error) {
			msg.channel.stopTyping();
			winston.error(error);
		}
	}

	parseSeason(season) {
		return season < 350 ? `${seasons[season % 10]} 20${Math.floor(season / 10)}` : `${seasons[season % 10]} 19${Math.floor(season / 10)}`;
	}
};

const { Command } = require('discord.js-commando');
const { escapeMarkdown } = require('discord.js');
const { oneLine } = require('common-tags');
const request = require('request-promise');
const winston = require('winston');
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');

const config = require('../../settings');
const Song = require('../../structures/Song');
const { version } = require('../../package');

module.exports = class PlaySongCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'play',
			group: 'music',
			memberName: 'play',
			description: 'Adds a song to the queue.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'url',
					prompt: 'what music would you like to listen to?\n',
					type: 'string'
				}
			]
		});

		this.queue = new Map();
		this.youtube = new YouTube(config.GoogleAPIKey);
	}

	async run(msg, args) {
		const url = args.url.replace(/<(.+)>/g, '$1');
		const queue = this.queue.get(msg.guild.id);

		let voiceChannel;
		if (!queue) {
			voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply('you aren\'t in a voice channel, ya dingus.');
			}

			const permissions = voiceChannel.permissionsFor(msg.client.user);
			if (!permissions.hasPermission('CONNECT')) {
				return msg.reply('I don\'t have permission to join your voice channel. No parties allowed there.');
			}
			if (!permissions.hasPermission('SPEAK')) {
				return msg.reply('I don\'t have permission to speak in your voice channel. What a disappointment.');
			}
		} else if (!queue.voiceChannel.members.has(msg.author.id)) {
			return msg.reply('you\'re not in the voice channel. You better not be trying to mess with their mojo, man.');
		}

		const statusMsg = await msg.reply('obtaining video details...');
		if (url.match(/^https?:\/\/(soundcloud.com|snd.sc)\/(.*)$/)) {
			try {
				const video = await request({
					uri: `http://api.soundcloud.com/resolve.json?url=${url}&client_id=${config.soundcloudID}`,
					headers: { 'User-Agent': `Commando v${version} (https://github.com/WeebDev/Commando/)` },
					json: true
				});

				return this.handleVideo(video, queue, voiceChannel, msg, statusMsg);
			} catch (error) {
				winston.error(`${error.statusCode}: ${error.statusMessage}`);
				return statusMsg.edit(`${msg.author}, ❌ This track is not able to be streamed by SoundCloud.`);
			}
		} else {
			return this.youtube.getVideo(url).then(video => {
				this.handleVideo(video, queue, voiceChannel, msg, statusMsg);
			}).catch(() => {
				this.youtube.searchVideos(url, 1).then(videos => {
					this.youtube.getVideoByID(videos[0].id).then(video2 => {
						this.handleVideo(video2, queue, voiceChannel, msg, statusMsg);
					}).catch(error => {
						winston.error(error);
						statusMsg.edit(`${msg.author}, couldn't obtain the search result video's details.`);
					});
				}).catch(() => {
					statusMsg.edit(`${msg.author}, there were no search results.`);
				});
			});
		}
	}

	async handleVideo(video, queue, voiceChannel, msg, statusMsg) { // eslint-disable-line consistent-return
		if (video.durationSeconds === 0) return statusMsg.edit(`${msg.author}, you can't play live streams.`);

		if (!queue) {
			queue = {
				textChannel: msg.channel,
				voiceChannel: voiceChannel,
				connection: null,
				songs: [],
				volume: this.client.provider.get(msg.guild.id, 'defaultVolume', config.defaultVolume)
			};
			await this.queue.set(msg.guild.id, queue);

			let result = await this.addSong(msg, video);
			let resultMessage = {
				color: 3447003,
				author: {
					name: `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
					icon_url: msg.author.displayAvatarURL // eslint-disable-line camelcase
				},
				description: result
			};

			if (!result.startsWith('👍')) {
				this.queue.delete(msg.guild.id);
				return statusMsg.edit('', { embed: resultMessage });
			}

			statusMsg.edit(`${msg.author}, joining your voice channel...`);
			try {
				const connection = await queue.voiceChannel.join();

				queue.connection = connection;
				await this.play(msg.guild, queue.songs[0]);
				statusMsg.delete();
			} catch (error) {
				winston.error('Error occurred when joining voice channel.', error);
				this.queue.delete(msg.guild.id);
				statusMsg.edit(`${msg.author}, unable to join your voice channel.`);
			}
		} else {
			let result = await this.addSong(msg, video);
			let resultMessage = {
				color: 3447003,
				author: {
					name: `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
					icon_url: msg.author.displayAvatarURL // eslint-disable-line camelcase
				},
				description: result
			};

			statusMsg.edit('', { embed: resultMessage });
		}
	}

	addSong(msg, video) {
		const queue = this.queue.get(msg.guild.id);

		if (!this.client.isOwner(msg.author)) {
			const maxLength = this.client.provider.get(msg.guild.id, 'maxLength', config.maxLength);
			if (maxLength > 0 && video.durationSeconds > maxLength * 60) {
				return oneLine`
					👎 ${escapeMarkdown(video.title)}
					(${Song.timeString(video.durationSeconds)})
					is too long. No songs longer than ${maxLength} minutes!
				`;
			}
			if (queue.songs.some(song => song.id === video.id)) {
				return `👎 ${escapeMarkdown(video.title)} is already queued.`;
			}
			const maxSongs = this.client.provider.get(msg.guild.id, 'maxSongs', config.maxSongs);
			if (maxSongs > 0 && queue.songs.reduce((prev, song) => prev + song.member.id === msg.author.id, 0) >= maxSongs) {
				return `👎 you already have ${maxSongs} songs in the queue. Don't hog all the airtime!`;
			}
		}

		winston.info('Adding song to queue.', { song: video.id, guild: msg.guild.id });
		const song = new Song(video, msg.member);
		queue.songs.push(song);
		return `👍 ${song.url.match(/^https?:\/\/(api.soundcloud.com)\/(.*)$/) ? `${song}` : `[${song}](${`${song.url}`})`}`;
	}

	play(guild, song) {
		const queue = this.queue.get(guild.id);

		const vote = this.votes.get(guild.id);
		if (vote) {
			clearTimeout(vote);
			this.votes.delete(guild.id);
		}

		if (!song) {
			queue.textChannel.sendMessage('We\'ve run out of songs! Better queue up some more tunes.');
			queue.voiceChannel.leave();
			this.queue.delete(guild.id);
			return;
		}

		const playingMessage = {
			color: 3447003,
			author: {
				name: song.username,
				icon_url: song.avatar // eslint-disable-line camelcase
			},
			description: `${song.url.match(/^https?:\/\/(api.soundcloud.com)\/(.*)$/) ? `${song}` : `[${song}](${`${song.url}`})`}`, // eslint-disable-line max-len
			image: { url: song.thumbnail }
		};

		const playing = queue.textChannel.sendMessage('', { embed: playingMessage });
		let stream;
		let streamErrored = false;
		if (song.url.match(/^https?:\/\/(api.soundcloud.com)\/(.*)$/)) {
			stream = request({ uri: song.url, headers: { 'User-Agent': `Commando v${version} (https://github.com/WeebDev/Commando/)` }, followAllRedirects: true }); // eslint-disable-line max-len
		} else {
			stream = ytdl(song.url, { audioonly: true })
				.on('error', err => {
					streamErrored = true;
					winston.error('Error occurred when streaming video:', err);
					playing.then(msg => msg.edit(`❌ Couldn't play ${song}. What a drag!`));
					queue.songs.shift();
					this.play(guild, queue.songs[0]);
				});
		}
		const dispatcher = queue.connection.playStream(stream, { passes: config.passes })
			.on('end', () => {
				if (streamErrored) return;
				queue.songs.shift();
				this.play(guild, queue.songs[0]);
			})
			.on('error', err => {
				winston.error('Error occurred in stream dispatcher:', err);
				queue.textChannel.sendMessage(`An error occurred while playing the song: \`${err}\``);
			});
		dispatcher.setVolumeLogarithmic(queue.volume / 5);
		song.dispatcher = dispatcher;
		song.playing = true;
	}

	get votes() {
		if (!this._votes) this._votes = this.client.registry.resolveCommand('music:skip').votes;
		return this._votes;
	}
};

/* eslint-disable no-console */
const { Command, CommandFormatError, util } = require('discord.js-commando');
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');
const oneLine = require('common-tags').oneLine;
const auth = require('../../auth.json');
const Song = require('../../song.js');
const escapeMarkdown = require('discord.js').escapeMarkdown;

module.exports = class PlaySongCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'play',
			group: 'music',
			memberName: 'play',
			description: 'Adds a song to the queue.',
			format: '<YouTube URL/ID/Search>',
			guildOnly: true,

			args: [
				{
					key: 'url',
					prompt: 'What music would you like to listen to?\n',
					type: 'string'
				}
			]
		});

		this.queue = new Map();
		this.youtube = new YouTube(auth.GoogleAPIKey);
	}

	async run(msg, args) {
		const url = args.url.replace(/<(.+)>/g, '$1');
		const queue = this.queue.get(msg.guild.id);

		// Get the voice channel the user is in
		let voiceChannel;
		if (!queue) {
			// Make sure the user is in a voice channel
			voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply('You aren\'t in a voice channel, ya dingus.');
			}

			// Ensure the bot has permission to join and speak
			const permissions = voiceChannel.permissionsFor(msg.client.user);
			if (!permissions.hasPermission('CONNECT')) {
				return msg.reply('I don\'t have permission to join your voice channel. No parties allowed there.');
			}
			if (!permissions.hasPermission('SPEAK')) {
				return msg.reply('I don\'t have permission to speak in your voice channel. What a disappointment.');
			}
		} else if (!queue.voiceChannel.members.has(msg.author.id)) {
			return msg.reply('You\'re not in the voice channel. You better not be trying to mess with their mojo, man.');
		}

		const statusMsg = await msg.reply('Obtaining video details...');
		return this.youtube.getVideo(url).then(video => {
			this.handleVideo(video, queue, voiceChannel, msg, statusMsg);
		}).catch(() => {
			// Search for a video
			this.youtube.searchVideos(url, 1).then(videos => {
				// Get the video's details
				this.youtube.getVideoByID(videos[0].id).then(video2 => {
					this.handleVideo(video2, queue, voiceChannel, msg, statusMsg);
				}).catch((error) => {
					console.log(error);
					statusMsg.edit(`${msg.author}, Couldn't obtain the search result video's details.`);
				});
			}).catch(() => {
				statusMsg.edit(`${msg.author}, There were no search results.`);
			});
		});
	}

	handleVideo(video, queue, voiceChannel, msg, statusMsg) {
		if (!queue) {
			// Create the guild's queue
			queue = {
				textChannel: msg.channel,
				voiceChannel: voiceChannel,
				connection: null,
				songs: [],
				volume: auth.defaultVolume
			};
			this.queue.set(msg.guild.id, queue);

			// Try to add the song to the queue
			const result = this.addSong(msg, video);
			if (!result.startsWith('👍')) {
				this.queue.delete(msg.guild.id);
				statusMsg.edit(`${msg.author}, ${result}`);
				return;
			}

			// Join the voice channel and start playing
			statusMsg.edit(`${msg.author}, Joining your voice channel...`);
			queue.voiceChannel.join().then(connection => {
				queue.connection = connection;
				this.play(msg.guild, queue.songs[0]);
				statusMsg.delete();
			}).catch(err2 => {
				console.log('Error occurred when joining voice channel.', err2);
				this.queue.delete(msg.guild.id);
				statusMsg.edit(`${msg.author}, Unable to join your voice channel.`);
			});
		} else {
			// Just add the song
			const result = this.addSong(msg, video);
			statusMsg.edit(`${msg.author}, ${result}`);
		}
	}

	addSong(msg, video) {
		const queue = this.queue.get(msg.guild.id);

		// Verify some stuff
		if (msg.author.id !== this.client.options.owner) {
			const maxLength = auth.maxLength;
			if (maxLength > 0 && video.durationSeconds > maxLength * 60) {
				return oneLine`
					👎 **${util.escape(video.title)}**
					(${Song.timeString(video.durationSeconds)})
					is too long. No songs longer than ${maxLength} minutes!
				`;
			}
			if (queue.songs.some(song => song.id === video.id)) {
				return `👎 **${escapeMarkdown(video.title)}** is already queued.`;
			}
			const maxSongs = auth.maxSongs;
			if (maxSongs > 0 && queue.songs.reduce((prev, song) => prev + song.member.id === msg.author.id, 0) >= maxSongs) {
				return `👎 You already have ${maxSongs} songs in the queue. Don't hog all the airtime!`;
			}
		}

		// Add the song to the queue
		console.log('Adding song to queue.', { song: video.id, guild: msg.guild.id });
		const song = new Song(video, msg.member);
		queue.songs.push(song);
		return `👍 Queued up ${song}.`;
	}

	play(guild, song) {
		const queue = this.queue.get(guild.id);

		// Kill the voteskip if active
		const vote = this.votes.get(guild.id);
		if (vote) {
			clearTimeout(vote);
			this.votes.delete(guild.id);
		}

		// See if we've finished the queue
		if (!song) {
			queue.textChannel.sendMessage('We\'ve run out of songs! Better queue up some more tunes.');
			queue.voiceChannel.leave();
			this.queue.delete(guild.id);
			return;
		}

		// Play the song
		const playing = queue.textChannel.sendMessage(`🎵 Playing ${song}, queued by ${song.username}.`);
		let streamErrored = false;
		const stream = ytdl(song.url, { audioonly: true })
			.on('error', err => {
				streamErrored = true;
				console.log('Error occurred when streaming video:', err);
				playing.then(msg => msg.edit(`❌ Couldn't play ${song}. What a drag!`));
				queue.songs.shift();
				this.play(guild, queue.songs[0]);
			});
		const dispatcher = queue.connection.playStream(stream, { passes: auth.passes })
			.on('end', () => {
				if (streamErrored) return;
				queue.songs.shift();
				this.play(guild, queue.songs[0]);
			})
			.on('error', err => {
				console.log('Error occurred in stream dispatcher:', err);
				queue.textChannel.sendMessage(`An error occurred while playing the song: \`${err}\``);
				queue.songs.shift();
				this.play(guild, queue.songs[0]);
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

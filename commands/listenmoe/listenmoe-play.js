/* eslint-disable no-console */
const { Command } = require('discord.js-commando');
const request = require('request-promise');
const io = require('socket.io-client');
const socket = io.connect('https://listen.moe/api/info');

const config = require('../../settings');

module.exports = class PlayListenMoeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'listenmoe-play',
			group: 'listenmoe',
			memberName: 'listenmoe-play',
			description: 'Starts a weeb party.',
			guildOnly: true
		});

		this.radio = new Map();
		this.playing; // eslint-disable-line no-unused-expressions
		this.songInfo; // eslint-disable-line no-unused-expressions
		socket.on('update', (obj) => {
			try {
				this.songInfo = obj;
			} catch (error) {
				console.log(error);
			}
		});
	}

	async run(msg) {
		const radio = this.radio.get(msg.guild.id);
		let voiceChannel;
		if (!radio) {
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
		} else if (!radio.voiceChannel.members.has(msg.author.id)) {
			return msg.reply('You\'re not in the voice channel. You better not be trying to mess with their mojo, man.');
		}

		const statusMsg = await msg.reply('Obtaining video details...');
		return this.addRadio(radio, voiceChannel, msg, statusMsg);
	}

	/* handleVideo() {
	} */

	addRadio(radio, voiceChannel, msg, statusMsg) {
		if (!radio) {
			// Create the guild's radio
			radio = {
				textChannel: msg.channel,
				voiceChannel: voiceChannel,
				connection: null,
				volume: config.defaultVolume
			};
			this.radio.set(msg.guild.id, radio);

			// Join the voice channel and start playing
			statusMsg.edit(`${msg.author}, Joining your voice channel...`);
			return radio.voiceChannel.join().then(connection => {
				radio.connection = connection;
				this.play(msg, msg.guild);
				statusMsg.delete();
			}).catch(err2 => {
				console.log('Error occurred when joining voice channel.', err2);
				this.radio.delete(msg.guild.id);
				statusMsg.edit(`${msg.author}, Unable to join your voice channel.`);
			});
		} else {
			return statusMsg.edit('I\'m already in here you dumbo!');
		}
	}

	message(msg, radio) {
		let oldInfo;
		this.playing = setInterval(() => {
			if (oldInfo === this.songInfo) return;

			let anime = this.songInfo.anime_name ? `\n\n**Anime:** ${this.songInfo.anime_name}` : '';
			let requestedBy = this.songInfo.requested_by ? `\n\n**Requested by:** [${this.songInfo.requested_by}](https://forum.listen.moe/u/${this.songInfo.requested_by})` : '';
			const playingMessage = {
				author: {
					name: 'Listen.moe',
					icon_url: 'https://listen.moe/files/images/favicons/favicon-32x32.png' // eslint-disable-line camelcase
				},
				color: 15473237,
				url: 'https://listen.moe',
				description: `${this.songInfo.song_name} by ${this.songInfo.artist_name}${anime}${requestedBy}\u200B`,
				timestamp: new Date(),
				footer: {
					icon_url: this.client.user.avatarURL, // eslint-disable-line camelcase
					text: 'Listen.moe'
				}
			};
			oldInfo = this.songInfo;
			radio.textChannel.sendMessage('', { embed: playingMessage });
		}, 15000);
	}

	play(msg, guild) {
		const radio = this.radio.get(guild.id);

		this.message(msg, radio);
		let stream;
		let streamErrored = false;
		stream = request({ uri: 'https://listen.moe/stream', headers: { 'User-Agent': `Commando (https://github.com/iCrawl/Commando/)` } });
		const dispatcher = radio.connection.playStream(stream, { passes: config.passes })
			.on('end', () => {
				if (streamErrored) return;
				radio.voiceChannel.leave();
				clearTimeout(this.playing);
				return;
			})
			.on('error', err => {
				console.log('Error occurred in stream dispatcher:', err);
				radio.voiceChannel.leave();
				clearTimeout(this.playing);
				return radio.textChannel.sendMessage(`An error occurred while playing the song: \`${err}\``);
			});
		dispatcher.setVolumeLogarithmic(radio.volume / 5);
		radio.dispatcher = dispatcher;
	}
};

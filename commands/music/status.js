const { Command } = require('discord.js-commando');
const Song = require('../../song.js');
const oneLine = require('common-tags').oneLine;

module.exports = class MusicStatusCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'status',
			aliases: ['song', 'playing', 'current-song', 'now-playing'],
			group: 'music',
			memberName: 'status',
			description: 'Shows the current status of the music.',
			guildOnly: true
		});
	}

	async run(msg) {
		const queue = this.queue.get(msg.guild.id);
		if (!queue) return 'There isn\'t any music playing right now. You should get on that.';
		const song = queue.songs[0];
		const currentTime = song.dispatcher ? song.dispatcher.time / 1000 : 0;
		return msg.reply(oneLine`
			Currently playing ${song}, queued by ${song.username}.
			We are ${Song.timeString(currentTime)} into the song, and have ${song.timeLeft(currentTime)} left.
			${!song.playing ? 'The music is paused.' : ''}
		`);
	}

	get queue() {
		if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;
		return this._queue;
	}
};

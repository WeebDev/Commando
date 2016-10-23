const { Command } = require('discord.js-commando');

module.exports = class StopMusicCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'stop',
			aliases: ['kill', 'stfu'],
			group: 'music',
			memberName: 'stop',
			description: 'Stops the music and wipes the queue.',
			details: 'Only moderators may use this command.',
			guildOnly: true
		});
	}

	async run(msg) {
		const queue = this.queue.get(msg.guild.id);
		if (!queue) return 'There isn\'t any music playing right now.';
		const song = queue.songs[0];
		queue.songs = [];
		if (song.dispatcher) song.dispatcher.end();
		return 'You\'ve just killed the party. Congrats. :clap:';
	}

	get queue() {
		if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;
		return this._queue;
	}
};

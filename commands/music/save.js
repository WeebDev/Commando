const stripIndents = require('common-tags').stripIndents;
const { Command } = require('discord.js-commando');

module.exports = class SaveQueueCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'save',
			aliases: ['save-songs', 'save-song-list'],
			group: 'music',
			memberName: 'save',
			description: 'Saves the queued songs.',
			// format: '[page]',
			guildOnly: true
		});
	}

	async run(msg) {
		const queue = this.queue.get(msg.guild.id);
		if (!queue) return 'There isn\'t any music playing right now. You should get on that.';
		const song = queue.songs[0];
		msg.reply('✔ Sent you info about the currently playing song!');
		return msg.direct(stripIndents`
			Currently playing ${song}, queued by ${song.username}.
			${song.url.match(/^https?:\/\/(api.soundcloud.com)\/(.*)$/) ? `A SoundCloud song is currently playing.` : `URL: <${song.url}>`}
		`);
	}

	get queue() {
		if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;
		return this._queue;
	}
};

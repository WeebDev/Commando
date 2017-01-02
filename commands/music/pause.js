const { Command } = require('discord.js-commando');

module.exports = class PauseSongCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'pause',
			aliases: ['shh', 'shhh', 'shhhh', 'shhhhh'],
			group: 'music',
			memberName: 'pause',
			description: 'Pauses the currently playing song.',
			guildOnly: true
		});
	}

	async run(msg) {
		const queue = this.queue.get(msg.guild.id);
		if (!queue) return msg.reply(`there isn't any music playing to pause, oh brilliant one.`);
		if (!queue.songs[0].dispatcher) return msg.reply('it\'s kind of tough to pause a song that hasn\'t even begun playing yet.');
		if (!queue.songs[0].playing) return msg.reply('pausing a song that is already paused is a bad move. I wouldn\'t recommend it.');
		queue.songs[0].dispatcher.pause();
		queue.songs[0].playing = false;

		return msg.reply(`paused the music. Use \`${this.client.commandPrefix}resume\` to continue playing.`);
	}

	get queue() {
		if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

		return this._queue;
	}
};

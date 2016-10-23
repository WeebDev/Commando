const stripIndents = require('common-tags').stripIndents;
const oneLine = require('common-tags').oneLine;
const { Command, util } = require('discord.js-commando');
const Song = require('../../song.js');
const auth = require('../../auth.json');

module.exports = class ViewQueueCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'queue',
			aliases: ['songs', 'song-list'],
			group: 'music',
			memberName: 'queue',
			description: 'Lists the queued songs.',
			format: '[page]',
			guildOnly: true
		});
	}

	async run(msg, args) {
		const page = parseInt(args) || 1;
		const queue = this.queue.get(msg.guild.id);
		if (!queue) return msg.reply('There are no songs in the queue. Why not start the party yourself?');
		const paginated = util.paginate(queue.songs, page, Math.floor(auth.paginationItems));
		const totalLength = queue.songs.reduce((prev, song) => prev + song.length, 0);
		const currentSong = queue.songs[0];
		const currentTime = currentSong.dispatcher ? currentSong.dispatcher.time / 1000 : 0;
		return msg.reply(stripIndents`
			__**Song queue, ${paginated.page}**__
			${paginated.items.map(song => `**-** ${song.name} (${song.lengthString})`).join('\n')}
			${paginated.maxPage > 1 ? `\nUse ${this.bot.util.usage(`queue <page>`, msg.guild)} to view a specific page.\n` : ''}
			**Now playing:** ${currentSong.name} (queued by ${currentSong.username})
			${oneLine`
				**Progress:**
				${!currentSong.playing ? 'Paused: ' : ''}${Song.timeString(currentTime)} /
				${currentSong.lengthString}
				(${currentSong.timeLeft(currentTime)} left)
			`}
			**Total queue time:** ${Song.timeString(totalLength)}
		`);
	}

	get queue() {
		if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;
		return this._queue;
	}
};

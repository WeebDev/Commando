const { Command, util } = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;
const stripIndents = require('common-tags').stripIndents;

const config = require('../../settings');
const Song = require('../../Song');

module.exports = class ViewQueueCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'queue',
			aliases: ['songs', 'song-list'],
			group: 'music',
			memberName: 'queue',
			description: 'Lists the queued songs.',
			format: '[page]',
			guildOnly: true,

			args: [
				{
					key: 'page',
					prompt: 'What page would you like to view?\n',
					type: 'integer',
					default: 1
				}
			]
		});
	}

	async run(msg, args) {
		const page = args.page;
		const queue = this.queue.get(msg.guild.id);
		if (!queue) return msg.reply('There are no songs in the queue. Why not start the party yourself?');

		const paginated = util.paginate(queue.songs, page, Math.floor(config.paginationItems));
		const totalLength = queue.songs.reduce((prev, song) => prev + song.length, 0);
		const currentSong = queue.songs[0];
		const currentTime = currentSong.dispatcher ? currentSong.dispatcher.time / 1000 : 0;

		const queueEmbed = {
			color: 3447003,
			author: {
				name: `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
				icon_url: `${msg.author.avatarURL}` // eslint-disable-line camelcase
			},
			description: stripIndents`
				__**Song queue, page ${paginated.page}**__
				${paginated.items.map(song => `**-** ${song.name} (${song.lengthString})`).join('\n')}
				${paginated.maxPage > 1 ? `\nUse \`queue <page>\` to view a specific page.\n` : ''}
				**Now playing:** ${currentSong.name}
				${oneLine`
					**Progress:**
					${!currentSong.playing ? 'Paused: ' : ''}${Song.timeString(currentTime)} /
					${currentSong.lengthString}
					(${currentSong.timeLeft(currentTime)} left)
				`}
				**Total queue time:** ${Song.timeString(totalLength)}
			`,
			timestamp: new Date(),
			footer: {
				icon_url: this.client.user.avatarURL, // eslint-disable-line camelcase
				text: 'Queue'
			}
		};

		return msg.channel.sendMessage('', { embed: queueEmbed });
	}

	get queue() {
		if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

		return this._queue;
	}
};

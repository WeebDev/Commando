const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');

module.exports = class SaveQueueCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'save',
			aliases: ['save-songs', 'save-song-list'],
			group: 'music',
			memberName: 'save',
			description: 'Saves the queued songs.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	run(msg) {
		const queue = this.queue.get(msg.guild.id);
		if (!queue) return msg.reply('there isn\'t any music playing right now. You should get on that.');
		const song = queue.songs[0];

		msg.reply('✔ Check your inbox!');
		let embed = {
			color: 3447003,
			author: {
				name: `${msg.author.tag} (${msg.author.id})`,
				icon_url: msg.author.displayAvatarURL({ format: 'png' }) // eslint-disable-line camelcase
			},
			description: stripIndents`
				**Currently playing:**
				${song.url.match(/^https?:\/\/(api.soundcloud.com)\/(.*)$/) ? `${song}` : `[${song}](${`${song.url}`})`}
				${song.url.match(/^https?:\/\/(api.soundcloud.com)\/(.*)$/) ? 'A SoundCloud song is currently playing.' : ''}
			`,
			image: { url: song.thumbnail }
		};

		return msg.author.send('', { embed });
	}

	get queue() {
		if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

		return this._queue;
	}
};

const { Command } = require('discord.js-commando');

module.exports = class ChangeVolumeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'volume',
			aliases: ['set-volume', 'set-vol', 'vol'],
			group: 'music',
			memberName: 'volume',
			description: 'Changes the volume.',
			format: '[level]',
			details: 'The volume level ranges from 0-10. You may specify "up" or "down" to modify the volume level by 2.',
			examples: ['volume', 'volume 7', 'volume up', 'volume down'],
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	run(msg, args) {
		const queue = this.queue.get(msg.guild.id);
		if (!queue) return msg.reply(`there isn't any music playing to change the volume of. Better queue some up!`);
		if (!args) return msg.reply(`the dial is currently set to ${queue.volume}.`);
		if (!queue.voiceChannel.members.has(msg.author.id)) {
			return msg.reply(`you're not in the voice channel. You better not be trying to mess with their mojo, man.`);
		}

		let volume = parseInt(args);
		if (isNaN(volume)) {
			volume = args.toLowerCase();
			if (volume === 'up' || volume === '+') volume = queue.volume + 2;
			else if (volume === 'down' || volume === '-') volume = queue.volume - 2;
			else return msg.reply(`invalid volume level. The dial goes from 0-10, baby.`);
			if (volume === 11) volume = 10;
		}

		volume = Math.min(Math.max(volume, 0), volume === 11 ? 11 : 10);
		queue.volume = volume;
		if (queue.songs[0].dispatcher) queue.songs[0].dispatcher.setVolumeLogarithmic(queue.volume / 5);

		return msg.reply(`${volume === 11 ? 'this one goes to 11!' : `set the dial to ${volume}.`}`);
	}

	get queue() {
		if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

		return this._queue;
	}
};

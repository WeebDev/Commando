const { Command } = require('discord.js-commando');

module.exports = class ChangeVolumeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'listenmoe-volume',
			aliases: ['listenmoe-vol'],
			group: 'listenmoe',
			memberName: 'listenmoe-volume',
			description: 'Changes the volume.',
			format: '[level]',
			details: 'The volume level ranges from 0-10. You may specify "up" or "down" to modify the volume level by 2.',
			guildOnly: true
		});
	}

	async run(msg, args) {
		const radio = this.radio.get(msg.guild.id);
		if (!radio) return msg.reply(`there isn't any music playing to change the volume of. Better radio some up!`);
		if (!args) return msg.reply(`the dial is currently set to ${radio.volume}.`);
		if (!radio.voiceChannel.members.has(msg.author.id)) {
			return msg.reply(`you're not in the voice channel. You better not be trying to mess with their mojo, man.`);
		}

		let volume = parseInt(args);
		if (isNaN(volume)) {
			volume = args.toLowerCase();
			if (volume === 'up' || volume === '+') {
				volume = radio.volume + 2;
			} else if (volume === 'down' || volume === '-') {
				volume = radio.volume - 2;
			} else {
				return msg.reply(`invalid volume level. The dial goes from 0-10, baby.`);
			}
			if (volume === 11) volume = 10;
		}

		volume = Math.min(Math.max(volume, 0), volume === 11 ? 11 : 10);
		radio.volume = volume;
		if (radio.dispatcher) radio.dispatcher.setVolumeLogarithmic(radio.volume / 5);

		return msg.reply(`${volume === 11 ? 'this one goes to 11!' : `set the dial to ${volume}.`}`);
	}

	get radio() {
		if (!this._radio) this._radio = this.client.registry.resolveCommand('listenmoe:listenmoe-play').radio;

		return this._radio;
	}
};

/* eslint-disable no-console */
const { Command } = require('discord.js-commando');

module.exports = class StopListenMoeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'listenmoe-stop',
			group: 'listenmoe',
			memberName: 'listenmoe-stop',
			description: 'Stops the weeb party.',
			guildOnly: true
		});
	}

	async run(msg) {
		const radio = this.radio.get(msg.guild.id);
		if (!radio) return msg.reply('there isn\'t any music playing right now.');
		if (radio.dispatcher) radio.dispatcher.end();

		return msg.reply('you\'ve just killed the weeb party. Congrats. 👏');
	}

	get radio() {
		if (!this._radio) this._radio = this.client.registry.resolveCommand('listenmoe:listenmoe-play').radio;

		return this._radio;
	}
};

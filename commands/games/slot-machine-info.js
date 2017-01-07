const { Command } = require('discord.js-commando');

const Currency = require('../../currency/Currency');

module.exports = class SlotMachineInfo extends Command {
	constructor(client) {
		super(client, {
			name: 'slotmachine-info',
			group: 'games',
			memberName: 'slotmachine-info',
			description: 'Displays information about the slotmachine.',
			details: 'Displays information about the slotmachine.',
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	async run(msg) {
		const balance = await Currency.getBalance('SLOTMACHINE');

		return msg.say(`The slotmachine currently holds ${balance} 🍩s`);
	}
};

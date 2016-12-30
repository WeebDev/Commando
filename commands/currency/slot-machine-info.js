const { Command } = require('discord.js-commando');
const Currency = require('../../Currency');

const currency = new Currency();

module.exports = class SlotMachineInfo extends Command {
	constructor(client) {
		super(client, {
			name: 'slotmachine-info',
			group: 'currency',
			memberName: 'slotmachine-info',
			description: 'Displays information about the slotmachine.',
			details: 'Displays information about the slotmachine.'
		});
	}

	async run(msg) {
		const balance = await currency.getBalance('SLOTMACHINE');

		return msg.say(`The slotmachine currently holds ${balance} 🍩s`);
	}
};

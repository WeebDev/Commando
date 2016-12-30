const { Command } = require('discord.js-commando');
const Currency = require('../../Currency');

const currency = new Currency();

module.exports = class SlotMachineInfo extends Command {
	constructor(client) {
		super(client, {
			name: 'money',
			aliases: ['monies', 'donut', 'donuts'],
			group: 'currency',
			memberName: 'info',
			description: 'Displays information about the slotmachine.',
			details: 'Display the amount of money you have earned. For example the pay table and the current donut count.'
		});
	}

	async run(msg, args) {
		const balance = await currency.getBalance('SLOTMACHINE');

		msg.say(`The slotmachine currently holds ${balance} 🍩s`);
	}
};

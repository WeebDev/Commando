const { Command } = require('discord.js-commando');

const Store = require('../../currency/Store');

module.exports = class StoreInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'item-info',
			aliases: ['info-item'],
			group: 'item',
			memberName: 'item-info',
			description: 'Displays price of an item.',
			display: 'Displays price of an item.',

			args: [
				{
					key: 'item',
					prompt: 'Which item would you like to know the price of?',
					type: 'string'
				}
			]
		});
	}

	async run(msg, args) {
		const item = Store.getItem(args.item);

		if (!item) return msg.reply(`sorry, but that item doesn't exist. You can use ${this.client.commandPrefix}store-items to get a list of the available items.`);

		return msg.reply(`one ${item.name} costs ${item.price} 🍩s`);
	}
};

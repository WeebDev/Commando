const { Command } = require('discord.js-commando');

const Store = require('../../currency/Store');

module.exports = class StoreInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'item-info',
			aliases: ['info-item'],
			group: 'item',
			memberName: 'info',
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
		const item = args.item;
		const storeItem = Store.getItem(item);

		if (!storeItem) return msg.reply(`sorry, but that item doesn't exist. You can use ${this.client.commandPrefix}store-items to get a list of the available items.`);

		return msg.reply(`one ${storeItem.name} costs ${storeItem.price} 🍩s`);
	}
};

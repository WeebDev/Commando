const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');

const Store = require('../../structures/currency/Store');

module.exports = class StoreInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'item-info',
			aliases: ['info-item'],
			group: 'item',
			memberName: 'info',
			description: 'Displays price of an item.',
			display: 'Displays price of an item.',
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'item',
					prompt: 'which item would you like to know the price of?\n',
					type: 'string',
					parse: str => str.toLowerCase()
				}
			]
		});
	}

	run(msg, { item }) {
		const storeItem = Store.getItem(item);
		if (!storeItem) {
			return msg.reply(stripIndents`
				sorry, but that item doesn't exist.

				You can use ${msg.usage()} to get a list of the available items.
			`);
		}

		const storeItemName = storeItem.name.replace(/(\b\w)/gi, lc => lc.toUpperCase());

		return msg.reply(`one ${storeItemName} costs ${storeItem.price} 🍩s`);
	}
};

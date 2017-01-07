const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

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
			throttling: {
				usages: 2,
				duration: 3
			},

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
		const item = args.item.toLowerCase();
		const storeItem = Store.getItem(item);

		if (!storeItem) {
			return msg.reply(stripIndents`
				sorry, but that item doesn't exist.
				You can use \`${this.client.commandPrefix}store\` to get a list of the available items.
			`);
		}

		const storeItemName = storeItem.name.replace(/(\b\w)/gi, lc => lc.toUpperCase());

		return msg.reply(`one ${storeItemName} costs ${storeItem.price} 🍩s`);
	}
};

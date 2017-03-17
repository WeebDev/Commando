const { Command } = require('discord.js-commando');

const Item = require('../../postgreSQL/models/Item');
const Store = require('../../currency/Store');
const StoreItem = require('../../currency/StoreItem');

module.exports = class ItemAddCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'item-add',
			aliases: ['add-item'],
			group: 'item',
			memberName: 'add',
			description: 'Adds an item to the store.',
			details: 'Adds an item to the store.',
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'name',
					prompt: 'what should the new item be called?\n',
					type: 'string'
				},
				{
					key: 'price',
					prompt: 'what should the new item cost?\n',
					type: 'integer',
					min: 1
				}
			]
		});
	}

	hasPermission(msg) {
		return this.client.isOwner(msg.author);
	}

	run(msg, args) {
		const name = args.name.toLowerCase();
		const { price } = args;
		const item = Store.getItem(name);

		if (item) return msg.reply('an item with that name already exists.');
		return Item.create({
			name,
			price
		}).then(newItem => {
			const newItemName = newItem.name.replace(/(\b\w)/gi, lc => lc.toUpperCase());
			Store.registerItem(new StoreItem(newItem.name, newItem.price));
			return msg.reply(`the item ${newItemName} has been successfully created!`);
		});
	}
};

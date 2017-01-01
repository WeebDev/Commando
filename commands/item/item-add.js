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
			memberName: 'item-add',
			description: 'Adds an item to the store.',
			details: 'Adds an item to the store.',

			args: [
				{
					key: 'name',
					prompt: 'What should the new item be called?',
					type: 'string'
				},
				{
					key: 'price',
					prompt: 'What should the new item cost?',
					type: 'integer',
					min: 1
				}
			]
		});
	}

	hasPermission(msg) {
		return msg.author.id === this.client.options.owner;
	}

	async run(msg, args) {
		const item = Store.getItem(args.name);

		if (item) return msg.reply('an item with that name already exists');

		return Item.create({
			name: args.name,
			price: args.price
		}).then(newItem => {
			Store.registerItem(new StoreItem(newItem.name, newItem.price));
			return msg.reply(`the item ${newItem.name} has been successfully created!`);
		});
	}
};

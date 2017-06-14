const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');

const Currency = require('../../structures/currency/Currency');
const Inventory = require('../../structures/currency/Inventory');
const ItemGroup = require('../../structures/currency/ItemGroup');
const Store = require('../../structures/currency/Store');

module.exports = class BuyItemCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'buy-item',
			aliases: ['item-buy', 'buy'],
			group: 'item',
			memberName: 'buy',
			description: 'Buys an item at the store.',
			details: 'Let\'s you exchange your hard earned donuts for other goods.',
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'item',
					prompt: 'what do you want to buy?\n',
					type: 'string',
					parse: str => str.toLowerCase()
				},
				{
					key: 'amount',
					label: 'amount to buy',
					prompt: 'how many do you want to buy?\n',
					type: 'integer',
					default: 1,
					min: 1
				}
			]
		});
	}

	async run(msg, { amount, item }) {
		const itemName = item.replace(/(\b\w)/gi, lc => lc.toUpperCase());
		const storeItem = Store.getItem(item);
		if (!storeItem) {
			return msg.reply(stripIndents`
				that item does not exist.

				You can use ${this.client.registry.commands.get('store').usage()} to get a list of the available items.
			`);
		}

		const balance = await Currency.getBalance(msg.author.id);
		const plural = amount > 1 || amount === 0;
		if (balance < storeItem.price * amount) {
			/* eslint-disable max-len */
			return msg.reply(stripIndents`
				you don't have enough donuts to buy ${amount} ${itemName}${plural ? 's' : ''}. ${amount} ${itemName}${plural ? 's' : ''} cost${plural ? '' : 's'} ${amount * storeItem.price} 🍩s.
				Your current account balance is ${balance} 🍩s.
			`);
			/* eslint-enable max-len */
		}

		const inventory = await Inventory.fetchInventory(msg.author.id);
		inventory.addItems(new ItemGroup(storeItem, amount));
		Currency.removeBalance(msg.author.id, amount * storeItem.price);
		inventory.save();

		return msg.reply(stripIndents`
			you have successfully purchased ${amount} ${itemName}${plural ? 's' : ''} for ${amount * storeItem.price} 🍩s.
		`);
	}
};

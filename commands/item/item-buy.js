const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Currency = require('../../currency/Currency');
const Inventory = require('../../currency/Inventory');
const ItemGroup = require('../../currency/ItemGroup');
const Store = require('../../currency/Store');

const currency = new Currency();

module.exports = class BuyItemCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'buy-item',
			aliases: ['buy', 'item-buy'],
			group: 'item',
			memberName: 'buy',
			description: 'Buys an item at the store.',
			details: 'Let\'s you exchange your hard earned donuts for other goods.',

			args: [
				{
					key: 'item',
					prompt: 'What do you want to buy?',
					type: 'string'
				},
				{
					key: 'amount',
					prompt: 'How many do you want to buy?',
					type: 'integer',
					default: 1,
					min: 1
				}
			]
		});
	}

	async run(msg, args) {
		const item = args.item;
		const amount = args.amount;
		const storeItem = Store.getItem(item);

		if (!storeItem) {
			return msg.reply(stripIndents`
				sorry, but that item does not exist.
				You can use ${this.client.commandPrefix}store-items to get a list of the available items.
			`);
		}

		const balance = await currency.getBalance(msg.author.id);

		const plural = amount > 1 || amount === 0;

		if (balance < storeItem.price * amount) {
			return msg.reply(stripIndents`
				you don't have enough donuts to buy ${amount} ${item}(s). ${amount} ${item}${plural ? 's' : ''} cost${plural ? '' : 's'} ${amount * item.price} 🍩s.
				Your current account balance is ${balance} 🍩s.
			`);
		}

		return Inventory.fetchInventory(msg.author.id).then(inventory => {
			inventory.addItems(new ItemGroup(storeItem, amount));
			currency.removeBalance(msg.author.id, amount * storeItem.price);
			return inventory.save();
		}).then(() => {
			return msg.reply(`you have successfully purchased ${amount} ${item}${plural ? 's' : ''} for ${amount * storeItem.price} 🍩s.`);
		});
	}
};

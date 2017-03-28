const { Collection } = require('discord.js');

const Item = require('../../models/Item');
const StoreItem = require('./StoreItem');

const storeItems = new Collection();

class Store {
	static registerItem(item) {
		storeItems.set(item.name, item);
	}

	static getItem(itemName) {
		return storeItems.get(itemName);
	}

	static getItems() {
		return storeItems;
	}
}

Item.findAll().then(items => {
	for (const item of items) Store.registerItem(new StoreItem(item.name, item.price));
});

module.exports = Store;

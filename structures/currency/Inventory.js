const UserProfile = require('../../models/UserProfile');
const ItemGroup = require('./ItemGroup');
const Redis = require('../Redis');

setInterval(async () => {
	const inventories = await Redis.db.hgetallAsync('inventory');
	const ids = Object.keys(inventories || {});

	/* eslint-disable no-await-in-loop */
	for (const id of ids) {
		const user = UserProfile.findOne({ where: { userID: id } });
		if (!user) {
			await UserProfile.create({
				userID: id,
				inventory: JSON.stringify(inventories[id])
			});
		} else {
			user.update({ inventory: JSON.stringify(inventories[id]) });
		}
	}
	/* eslint-enable no-await-in-loop */
}, 30 * 60 * 1000);

class Inventory {
	constructor(user, content) {
		this.user = user;
		this.content = content || {};
	}

	addItem(item) {
		const itemGroup = new ItemGroup(item, 1);
		this.addItems(itemGroup);
	}

	addItems(itemGroup) {
		const amountInInventory = this.content[itemGroup.item.name] ? this.content[itemGroup.item.name].amount : 0;
		itemGroup.amount += amountInInventory;
		this.content[itemGroup.item.name] = itemGroup;
	}

	removeItem(item) {
		const itemGroup = new ItemGroup(item, 1);
		this.removeItems(itemGroup);
	}

	removeItems(itemGroup) {
		const amountInInventory = this.content[itemGroup.item.name] ? this.content[itemGroup.item.name].amount : 0;

		if (amountInInventory === itemGroup.amount) {
			delete this.content[itemGroup.item.name];
		} else if (amountInInventory > itemGroup.amount) {
			itemGroup.amount = amountInInventory - itemGroup.amount;
			this.content[itemGroup.item.name] = itemGroup;
		}
	}

	save() {
		return Redis.db.hsetAsync('inventory', this.user, JSON.stringify(this.content));
	}

	static fetchInventory(user) {
		return new Promise((resolve, reject) => {
			Redis.db.hgetAsync('inventory', user).then(content => {
				resolve(new Inventory(user, JSON.parse(content)));
			}).catch(reject);
		});
	}
}

module.exports = Inventory;

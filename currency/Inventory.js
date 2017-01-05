const InventoryDB = require('../postgreSQL/models/Inventory');
const ItemGroup = require('./ItemGroup');
const Redis = require('../redis/Redis');

const redis = new Redis();

setInterval(() => {
	redis.db.hgetallAsync('inventory').then(inventories => {
		const ids = Object.keys(inventories);

		for (const id of ids) {
			InventoryDB.findOne({ where: { userID: id } }).then(user => {
				if (!user) {
					InventoryDB.create({
						userID: id,
						content: JSON.stringify(inventories[id])
					});
				} else {
					user.update({ content: JSON.stringify(inventories[id]) });
				}
			});
		}
	});
}, 60 * 60 * 1000);

class Inventory {
	constructor(user, content) {
		this.user = user;
		this.content = content || {};
	}

	static fetchInventory(user) {
		return new Promise((resolve, reject) => {
			redis.db.hgetAsync('inventory', user).then(content => {
				resolve(new Inventory(user, JSON.parse(content)));
			}).catch(reject);
		});
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
		return redis.db.hsetAsync('inventory', this.user, JSON.stringify(this.content));
	}
}

module.exports = Inventory;

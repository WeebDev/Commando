const UserProfile = require('../postgreSQL/models/UserProfile');
const ItemGroup = require('./ItemGroup');
const Redis = require('../redis/Redis');

const redis = new Redis();

setInterval(() => {
	redis.db.hgetallAsync('inventory').then(inventories => {
		const ids = Object.keys(inventories || {});

		for (const id of ids) {
			UserProfile.findOne({ where: { userID: id } }).then(async user => {
				if (!user) {
					await UserProfile.create({
						userID: id,
						inventory: JSON.stringify(inventories[id])
					});
				} else {
					await user.update({ inventory: JSON.stringify(inventories[id]) });
				}
			});
		}
	});
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
		return redis.db.hsetAsync('inventory', this.user, JSON.stringify(this.content));
	}

	static fetchInventory(user) {
		return new Promise((resolve, reject) => {
			redis.db.hgetAsync('inventory', user).then(content => {
				resolve(new Inventory(user, JSON.parse(content)));
			}).catch(reject);
		});
	}
}

module.exports = Inventory;

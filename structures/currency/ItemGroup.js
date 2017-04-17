class ItemGroup {
	constructor(item, amount) {
		this.item = item;
		this.amount = amount;
	}

	static convert(item, amount) {
		item = item.toLowerCase();
		if (amount > 1 && /s$/.test(item)) return item.slice(0, -1);

		return item;
	}
}

module.exports = ItemGroup;

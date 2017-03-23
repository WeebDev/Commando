module.exports = class DocumentedItem {
	constructor(parent, info) {
		this.parent = parent;
		this.directData = {};
		this.registerMetaInfo(info);
	}

	registerMetaInfo() {
		return;
	}

	serialize() {
		return;
	}
};

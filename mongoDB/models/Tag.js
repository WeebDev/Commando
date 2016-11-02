const mongoose = require('mongoose');

const { Schema } = require('../mongoDB');

let TagSchema = new Schema({
	userID: String,
	userName: String,
	guildID: String,
	guildName: String,
	channelID: String,
	channelName: String,
	name: String,
	content: String,
	uses: { type: Number, default: 0 },
	createdAt: { type: Date, default: Date.now },
	editedAt: { type: Date, default: Date.now }
});
let Tag = mongoose.model('Tag', TagSchema);

module.exports = class TagModel {
	constructor(options = {}) {
		this.tag = options;
	}

	static async find(guildID) {
		return Tag.find({ guildID: guildID });
	}

	static async findAll() {
		return Tag.find({});
	}

	static async get(name, guildID) {
		return Tag.findOne({ name: name, guildID: guildID });
	}

	static async getAny(name) {
		return Tag.findOne({ name: name });
	}

	static async update(name, guildID, userID, content, date) {
		return Tag.findOneAndUpdate({ name: name, guildID: guildID, userID: userID }, { content: content, editedAt: date });
	}

	static async incrementUses(name, guildID) {
		return Tag.findOneAndUpdate({ name: name, guildID: guildID }, { $inc: { uses: 1 } });
	}

	static async delete(name, guildID) {
		return Tag.findOneAndRemove({ name: name, guildID: guildID });
	}

	static async deleteAny(name) {
		return Tag.findOneAndRemove({ name: name });
	}

	save() {
		return Tag.create(this.tag);
	}
};

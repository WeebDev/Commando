const mongoose = require('mongoose');
const { Schema } = require('../../mongodb.js');

let TagSchema = new Schema({
	userID: String,
	username: String,
	guildID: String,
	guildName: String,
	channelID: String,
	channelName: String,
	name: String,
	content: String,
	createdAt: { type: Date, default: Date.now },
	editedAt: { type: Date, default: Date.now }
});

let Tag = mongoose.model('Tag', TagSchema);

module.export = class TagModel {
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

	static async delete(name, guildID) {
		return Tag.findOneAndRemove({ name: name, guildID: guildID });
	}

	static async deleteAny(name) {
		return Tag.findOneAndRemove({ name: name });
	}

	async save() {
		return Tag.create(this.tag);
	}
};

const mongoose = require('mongoose');
const { Schema } = require('../../mongodb.js');

let TagSchema = new Schema({
	userID: String,
	userName: String,
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

module.exports = class TagModel {
	constructor(options = {}) {
		this.tag = options;
	}

	static find(guildID) {
		return Tag.find({ guildID: guildID });
	}

	static findAll() {
		return Tag.find({});
	}

	static get(name, guildID) {
		return Tag.findOne({ name: name, guildID: guildID });
	}

	static getAny(name) {
		return Tag.findOne({ name: name });
	}

	static update(name, guildID, userID, content, date) {
		return Tag.findOneAndUpdate({ name: name, guildID: guildID, userID: userID }, { content: content, editedAt: date });
	}

	static delete(name, guildID) {
		return Tag.findOneAndRemove({ name: name, guildID: guildID });
	}

	static deleteAny(name) {
		return Tag.findOneAndRemove({ name: name });
	}

	save() {
		return Tag.create(this.tag);
	}
};

const mongoose = require('mongoose');

const { Schema } = require('../mongoDB');

let RepSchema = new Schema({
	userID: String,
	userName: String,
	targetID: String,
	targetName: String,
	guildID: String,
	guildName: String,
	content: String,
	rep: String,
	createdAt: Number
});
let Rep = mongoose.model('Rep', RepSchema);

module.exports = class RepModel {
	constructor(options = {}) {
		this.rep = options;
	}
	static async find(guildID) {
		return Rep.find({ guildID: guildID });
	}
	static async findAll(targetID) {
		return Rep.find({ targetID: targetID });
	}
	static async get(targetID, userID, guildID) {
		return Rep.findOne({ targetID: targetID, userID: userID, guildID: guildID }).sort({ createdAt: -1 });
	}
	static async getAny(name) {
		return Rep.findOne({ name: name });
	}
	save() {
		return Rep.create(this.rep);
	}
};

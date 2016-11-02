const mongoose = require('mongoose');

const { Schema } = require('../mongoDB');

let repUserSchema = new Schema({
	userID: String,
	userName: String,
	guildID: String,
	guildName: String,
	positive: { type: Number, default: 0 },
	negative: { type: Number, default: 0 },
	createdAt: Number
});
let repUser = mongoose.model('RepUser', repUserSchema);

module.exports = class RepUserModel {
	constructor(options = {}) {
		this.rep = options;
	}
	static async find(guildID) {
		return repUser.find({ guildID: guildID });
	}
	static async findAll() {
		return repUser.find({});
	}
	static async get(userID, guildID) {
		return repUser.findOne({ userID: userID, guildID: guildID });
	}
	static async getAny(userID) {
		return repUser.findOne({ userID: userID });
	}
	static async incrementPositive(userID, guildID) {
		return repUser.findOneAndUpdate({ userID: userID, guildID: guildID }, { $inc: { positive: 1 } });
	}
	static async incrementNegative(userID, guildID) {
		return repUser.findOneAndUpdate({ userID: userID, guildID: guildID }, { $inc: { negative: 1 } });
	}
	save() {
		return repUser.create(this.rep);
	}
};

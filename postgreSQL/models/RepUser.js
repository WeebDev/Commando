const Sequelize = require('sequelize');

const Database = require('../postgreSQL');

const database = new Database();

let RepUser = database.db.define('rep-user', {
	userID: { type: Sequelize.STRING },
	userName: { type: Sequelize.STRING },
	guildID: { type: Sequelize.STRING },
	guildName: { type: Sequelize.STRING },
	positive: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	},
	negative: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	}
});

RepUser.sync();

module.exports = RepUser;

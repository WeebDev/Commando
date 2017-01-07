const Sequelize = require('sequelize');

const Database = require('../PostgreSQL');

const database = new Database();

let UserProfile = database.db.define('userProfiles', {
	userID: Sequelize.STRING,
	inventory: {
		type: Sequelize.STRING,
		defaultValue: '[]'
	},
	money: {
		type: Sequelize.BIGINT(), // eslint-disable-line new-cap
		defaultValue: 0
	},
	experience: {
		type: Sequelize.BIGINT(), // eslint-disable-line new-cap
		defaultValue: 0
	},
	personalMessage: {
		type: Sequelize.STRING,
		defaultValue: ''
	}
});

UserProfile.sync();

module.exports = UserProfile;

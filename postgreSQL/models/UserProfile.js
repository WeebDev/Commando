const Sequelize = require('sequelize');

const Database = require('../PostgreSQL');

const database = new Database();

let UserProfile = database.db.define('userProfiles', {
	userID: Sequelize.STRING,
	inventory: {
		type: Sequelize.STRING,
		default: '[]'
	},
	money: {
		type: Sequelize.BIGINT(), // eslint-disable-line new-cap
		default: 0
	},
	experience: {
		type: Sequelize.BIGINT(), // eslint-disable-line new-cap
		default: 0
	},
	personalMessage: {
		type: Sequelize.STRING,
		default: ''
	}
});

UserProfile.sync();

module.exports = UserProfile;

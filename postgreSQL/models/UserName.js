const Sequelize = require('sequelize');

const Database = require('../PostgreSQL');

const database = new Database();

const UserName = database.db.define('userName', {
	userID: Sequelize.STRING,
	username: Sequelize.STRING
}, {
	indexes: [{ fields: ['userID'] }, {
		fields: ['userID', 'username'],
		unique: true
	}]
});

module.exports = UserName;

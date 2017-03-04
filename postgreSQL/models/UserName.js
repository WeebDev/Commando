const Sequelize = require('sequelize');

const Database = require('../PostgreSQL');

const database = new Database();

const UserName = database.db.define('UserNames', {
	userid: Sequelize.STRING,
	username: Sequelize.STRING
}, {
	indexes: [{
		fields: ['userid', 'username'],
		unique: true
	}]
});

UserName.sync();

module.exports = UserName;

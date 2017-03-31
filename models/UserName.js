const Sequelize = require('sequelize');

const Database = require('../structures/PostgreSQL');

const UserName = Database.db.define('userName', {
	userID: Sequelize.STRING,
	username: Sequelize.STRING
}, {
	indexes: [
		{ fields: ['userID'] },
		{
			fields: ['userID', 'username'],
			unique: true
		}
	]
});

module.exports = UserName;

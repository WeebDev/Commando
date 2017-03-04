const Sequelize = require('sequelize');

const Database = require('../PostgreSQL');

const database = new Database();

const UserName = database.db.define('UserNames', {
	userid: Sequelize.STRING,
	username: Sequelize.STRING
});

UserName.sync();

module.exports = UserName;

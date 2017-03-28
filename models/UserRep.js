const Sequelize = require('sequelize');

const Database = require('../structures/PostgreSQL');

const database = new Database();

const UserProfile = database.db.define('userRep', {
	userID: Sequelize.STRING,
	reputationType: Sequelize.STRING,
	reputationBy: Sequelize.STRING,
	reputationMessage: Sequelize.STRING
});

module.exports = UserProfile;

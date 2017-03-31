const Sequelize = require('sequelize');

const Database = require('../structures/PostgreSQL');

const UserProfile = Database.db.define('userRep', {
	userID: Sequelize.STRING,
	reputationType: Sequelize.STRING,
	reputationBy: Sequelize.STRING,
	reputationMessage: Sequelize.STRING
});

module.exports = UserProfile;

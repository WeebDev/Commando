const Sequelize = require('sequelize');

const Database = require('../PostgreSQL');

const database = new Database();

let Experience = database.db.define('experience', {
	userID: Sequelize.STRING,
	experience: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	}
});

Experience.sync();

module.exports = Experience;

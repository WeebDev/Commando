const Sequelize = require('sequelize');

const Database = require('../PostgreSQL');

const database = new Database();

let Experience = database.db.define('experience', {
	userID: Sequelize.STRING,
	experience: {
		type: Sequelize.BIGINT(), // eslint-disable-line new-cap
		defaultValue: 0
	}
});

Experience.sync();

module.exports = Experience;

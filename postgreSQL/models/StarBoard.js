const Sequelize = require('sequelize');

const Database = require('../PostgreSQL');

const database = new Database();

let StarBoard = database.db.define('starBoard', {
	guildID: Sequelize.STRING,
	starred: {
		type: Sequelize.JSONB(), // eslint-disable-line new-cap
		defaultValue: {}
	}
});

module.exports = StarBoard;

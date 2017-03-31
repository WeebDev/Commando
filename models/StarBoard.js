const Sequelize = require('sequelize');

const Database = require('../structures/PostgreSQL');

const StarBoard = Database.db.define('starBoard', {
	guildID: Sequelize.STRING,
	starred: {
		type: Sequelize.JSONB(), // eslint-disable-line new-cap
		defaultValue: {}
	}
});

module.exports = StarBoard;

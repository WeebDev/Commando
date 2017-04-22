const Sequelize = require('sequelize');

const Database = require('../structures/PostgreSQL');

const Star = Database.db.define('stars', {
	messageID: {
		type: Sequelize.STRING,
		primaryKey: true,
		allowNull: false,
		unique: true
	},
	content: {
		type: Sequelize.STRING(1024), // eslint-disable-line new-cap
		allowNull: false
	},
	authorID: {
		type: Sequelize.STRING,
		allowNull: false
	},
	starboardMessageID: {
		type: Sequelize.STRING,
		allowNull: false
	},
	stars: {
		type: Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 0
	},
	starredBy: {
		type: Sequelize.ARRAY(Sequelize.STRING), // eslint-disable-line new-cap
		allowNull: false
	}
});

module.exports = Star;

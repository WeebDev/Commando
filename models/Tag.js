const Sequelize = require('sequelize');

const Database = require('../structures/PostgreSQL');

const Tag = Database.db.define('tags', {
	userID: Sequelize.STRING,
	userName: Sequelize.STRING,
	guildID: Sequelize.STRING,
	guildName: Sequelize.STRING,
	name: Sequelize.STRING,
	content: Sequelize.STRING(1800), // eslint-disable-line new-cap
	type: {
		type: Sequelize.BOOLEAN,
		defaultValue: false
	},
	example: {
		type: Sequelize.BOOLEAN,
		defaultValue: false
	},
	exampleID: {
		type: Sequelize.STRING,
		defaultValue: ''
	},
	uses: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	}
});

module.exports = Tag;

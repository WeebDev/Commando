const Sequelize = require('sequelize');

const Database = require('../PostgreSQL');

const database = new Database();

let Tag = database.db.define('tags', {
	userID: { type: Sequelize.STRING },
	userName: { type: Sequelize.STRING },
	guildID: { type: Sequelize.STRING },
	guildName: { type: Sequelize.STRING },
	name: { type: Sequelize.STRING },
	content: { type: Sequelize.STRING(1800) }, // eslint-disable-line new-cap
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

Tag.sync();

module.exports = Tag;

const Sequelize = require('sequelize');

const Database = require('../postgreSQL');

const database = new Database();

let Rep = database.db.define('rep', {
	userID: { type: Sequelize.STRING },
	userName: { type: Sequelize.STRING },
	targetID: { type: Sequelize.STRING },
	targetName: { type: Sequelize.STRING },
	guildID: { type: Sequelize.STRING },
	guildName: { type: Sequelize.STRING },
	content: { type: Sequelize.STRING },
	rep: { type: Sequelize.STRING }
});

Rep.sync();

module.exports = Rep;

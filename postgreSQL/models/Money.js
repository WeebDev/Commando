const Sequelize = require('sequelize');

const Database = require('../postgreSQL');

const database = new Database();

let Money = database.db.define('money', {
	userID: Sequelize.STRING,
	money: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	}
});

Money.sync();

module.exports = Money;

const Sequelize = require('sequelize');

const Database = require('../postgreSQL');

const database = new Database();

let Inventory = database.db.define('inventories', {
	userID: Sequelize.STRING,
	content: Sequelize.STRING
});

Inventory.sync();

module.exports = Inventory;

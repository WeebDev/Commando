const Sequelize = require('sequelize');

const Database = require('../PostgreSQL');

const database = new Database();

let Item = database.db.define('items', {
	name: Sequelize.STRING,
	price: Sequelize.INTEGER
});

Item.sync();

module.exports = Item;

const Sequelize = require('sequelize');

const Database = require('../PostgreSQL');

const database = new Database();

const Item = database.db.define('items', {
	name: Sequelize.STRING,
	price: Sequelize.INTEGER
});

module.exports = Item;

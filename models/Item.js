const Sequelize = require('sequelize');

const Database = require('../structures/PostgreSQL');

const database = new Database();

const Item = database.db.define('items', {
	name: Sequelize.STRING,
	price: Sequelize.INTEGER
});

module.exports = Item;

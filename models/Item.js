const Sequelize = require('sequelize');

const Database = require('../structures/PostgreSQL');

const Item = Database.db.define('items', {
	name: Sequelize.STRING,
	price: Sequelize.INTEGER
});

module.exports = Item;

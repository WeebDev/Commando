const Sequelize = require('sequelize');

const Database = require('../structures/PostgreSQL');

const Item = Database.db.define('items', {
	name: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true
	},
	price: {
		type: Sequelize.INTEGER,
		allowNull: false
	}
});

module.exports = Item;

const Sequelize = require('sequelize');
const winston = require('winston');

const db = require('../settings').db;

class Database {
	constructor() {
		this.database = new Sequelize(db, { logging: false });
	}

	get db() {
		return this.database;
	}

	start() {
		this.database.authenticate()
			.then(() => winston.info('Connection has been established successfully.'))
			.then(() => this.database.sync())
			.then(() => winston.info('Syncing Database...'))
			.catch(err => winston.error(`Unable to connect to the database: ${err}`));
	}
}

module.exports = Database;

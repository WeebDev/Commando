const Sequelize = require('sequelize');
const winston = require('winston');

const { db } = require('../settings');

const database = new Sequelize(db, { logging: false });

class Database {
	static get db() {
		return database;
	}

	start() {
		database.authenticate()
			.then(() => winston.info('Connection to database has been established successfully.'))
			.then(() => winston.info('Synchronizing database...'))
			.then(() => database.sync()
				.then(() => winston.info('Synchronizing database done!'))
				.catch(error => winston.error(`Error synchronizing the database: ${error}`))
			)
			.then(() => winston.info('Ready to rock!'))
			.catch(err => winston.error(`Unable to connect to the database: ${err}`));
	}
}

module.exports = Database;

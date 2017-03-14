import { Sequelize } from 'sequelize';
import * as winston from 'winston';

const db: string = require('../settings.json').db;
const database: Sequelize = new Sequelize(db, { logging: false });

export default class Database {
	static get db(): Sequelize {
		return database;
	}

	public static start(): void {
		Database.db.authenticate()
			.then(() => winston.info('Connection has been established successfully.'))
			.then(() => this.db.sync())
			.then(() => winston.info('Syncing Database...'))
			.catch((err: Error) => winston.error(`Unable to connect to the database: ${err}`));
	}
}

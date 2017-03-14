import { DataTypes, Model, Sequelize } from 'sequelize';

import Database from '../PostgreSQL';

export default class Starboard extends Model {
	public id: number;
	public guildID: string;
	public starred: object;
	public createdAt: Date;
	public updatedAt: Date;
}

Starboard.init({
	guildID: DataTypes.STRING
	starred: DataTypes.JSONB()
}, { sequelize: Database.db });

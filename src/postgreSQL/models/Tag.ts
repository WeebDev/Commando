import { DataTypes, Model, Sequelize } from 'sequelize';

import Database from '../PostgreSQL';

export default class Tag extends Model {
	public id: number;
	public userID: string;
	public userName: string;
	public guildID: string;
	public guildName: string;
	public name: string;
	public content: string;
	public type: boolean;
	public example: boolean;
	public exampleID: string;
	public uses: number;
	public createdAt: Date;
	public updatedAt: Date;
}

Tag.init({
	userID: DataTypes.STRING,
	userName: DataTypes.STRING,
	guildID: DataTypes.STRING,
	guildName: DataTypes.STRING,
	name: DataTypes.STRING,
	content: DataTypes.STRING(1800), // eslint-disable-line new-cap
	type: {
		type: DataTypes.BOOLEAN,
		defaultValue: false
	},
	example: {
		type: DataTypes.BOOLEAN,
		defaultValue: false
	},
	exampleID: {
		type: DataTypes.STRING,
		defaultValue: ''
	},
	uses: {
		type: DataTypes.INTEGER,
		defaultValue: 0
	}
}, { sequelize: Database.db });

import { DataTypes, Model, Sequelize } from 'sequelize';

import Database from '../PostgreSQL';

export default class UserName extends Model {
	public id: number;
	public userID: string;
	public username: string;
	public createdAt: Date;
	public updatedAt: Date;
}

UserName.init({
	userID: DataTypes.STRING,
	username: DataTypes.STRING
}, {
	sequelize: Database.db,
	indexes: [
		{ fields: ['userID'] }, {
			fields: ['userID', 'username'],
			unique: true
		}
	]
});

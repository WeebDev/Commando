import { DataTypes, Model, Sequelize } from 'sequelize';

import Database from '../PostgreSQL';

export default class UserRep extends Model {
	public id: number;
	public userID: string;
	public reputationType: string;
	public reputationBy: string;
	public reputationMessage: string;
	public createdAt: Date;
	public updatedAt: Date;
}

UserRep.init({
	userID: DataTypes.STRING,
	reputationType: DataTypes.STRING,
	reputationBy: DataTypes.STRING,
	reputationMessage: DataTypes.STRING
}, { sequelize: Database.db });

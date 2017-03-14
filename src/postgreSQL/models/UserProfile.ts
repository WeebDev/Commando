import { DataTypes, Model, Sequelize } from 'sequelize';

import Database from '../PostgreSQL';

export default class UserProfile extends Model {
	public id: number;
	public userID: string;
	public inventory: string;
	public money: number;
	public balance: number;
	public networth: number;
	public experience: number;
	public personalMessage: string;
	public background: string;
	public createdAt: Date;
	public updatedAt: Date;
}

UserProfile.init({
	userID: DataTypes.STRING,
	inventory: {
		type: DataTypes.STRING,
		defaultValue: '[]'
	},
	money: {
		type: DataTypes.BIGINT(), // eslint-disable-line new-cap
		defaultValue: 0
	},
	balance: {
		type: DataTypes.BIGINT(), // eslint-disable-line new-cap
		defaultValue: 0
	},
	networth: {
		type: DataTypes.BIGINT(), // eslint-disable-line new-cap
		defaultValue: 0
	},
	experience: {
		type: DataTypes.BIGINT(), // eslint-disable-line new-cap
		defaultValue: 0
	},
	personalMessage: {
		type: DataTypes.STRING,
		defaultValue: ''
	},
	background: {
		type: DataTypes.STRING,
		defaultValue: 'default'
	}
}, { sequelize: Database.db });

import { DataTypes, Model, Sequelize } from 'sequelize';

import Database from '../PostgreSQL';

export default class Item extends Model {
	public id: number;
	public name: string;
	public price: number;
	public createdAt: Date;
	public updatedAt: Date;
}

Item.init({
	name: DataTypes.STRING,
	price: DataTypes.INTEGER
}, { sequelize: Database.db });

import { Model, DataTypes } from "sequelize";
import sequelize from "../sequelize";

class Client extends Model {
    public id!: number;
    public name!: string;
    public clientSecret!: string;
}

Client.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: DataTypes.STRING,
    clientSecret: DataTypes.STRING
}, {
    modelName: 'client', sequelize
})

export default Client;

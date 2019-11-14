import { Model, DataTypes } from "sequelize";
import {connection} from "../sequelize";

class Client extends Model {
    public id!: string;
    public name!: string;
    public clientSecret!: string;
}

Client.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    name: DataTypes.STRING,
    clientSecret: DataTypes.STRING
}, {
    modelName: 'client', sequelize: connection
})

export default Client;

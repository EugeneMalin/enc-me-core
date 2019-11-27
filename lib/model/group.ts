import {connection} from "../sequelize";
import { Model, DataTypes } from 'sequelize';  

class Group extends Model {
    public id!: string;
    public token!: string;
    public name!: string;
    public isClosed!: boolean;
}

Group.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: DataTypes.STRING,
    isClosed: DataTypes.BOOLEAN,
    token: DataTypes.STRING
}, {
    modelName: 'group', sequelize: connection
})

export default Group;

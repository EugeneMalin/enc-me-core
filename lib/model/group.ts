import {connection} from "../sequelize";
import { Model, DataTypes } from 'sequelize';  

class Group extends Model {
    public id!: string;
    public token!: string;
}

Group.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    token: DataTypes.STRING
}, {
    modelName: 'group', sequelize: connection
})

export default Group;

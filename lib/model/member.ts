import {connection} from "../sequelize";
import { Model, DataTypes } from 'sequelize';  

class Member extends Model {
    public isCaptain!: boolean;
    public id!: number;
    public groupId!: string;
    public userId!: number;
}

Member.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    groupId: DataTypes.UUID,
    isCaptain: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isBot: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    modelName: 'member', sequelize: connection
})

export default Member;

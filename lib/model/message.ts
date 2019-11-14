import { Model, DataTypes } from 'sequelize';  
import {connection} from '../sequelize';

class Message extends Model {
    public id!: string;
    public text!: string;
    public teamId!: number;
    public userId!: number;
    public createdAt!: Date;
}

Message.init({
    text: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    teamId: DataTypes.INTEGER,
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    }
}, {
    sequelize: connection, modelName: 'message' 
})

export default Message;

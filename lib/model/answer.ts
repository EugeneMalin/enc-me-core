import {connection} from "../sequelize";
import { Model, DataTypes } from 'sequelize';  

class Answer extends Model {
    public id!: string
    public taskId!: number
    public userId!: number
    public groupId!: string
    public isRight!: boolean
}

Answer.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: DataTypes.INTEGER,
    taskId: DataTypes.INTEGER,
    groupId: DataTypes.UUID,
    isRight: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    modelName: 'answer', sequelize: connection
})

export default Answer;

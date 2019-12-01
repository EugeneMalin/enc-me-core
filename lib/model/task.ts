import {connection} from "../sequelize";
import { Model, DataTypes } from 'sequelize';  

class Task extends Model {
    public id!: number
    public matchId!: number
    public step!: number
    public answer!: string
    public question!: string
    public timeLimit!: string
}

Task.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    matchId: DataTypes.UUID,
    step: DataTypes.INTEGER,
    answer: DataTypes.STRING,
    question: DataTypes.TEXT,
    timeLimit: DataTypes.INTEGER
}, {
    modelName: 'task', sequelize: connection
})

export default Task;

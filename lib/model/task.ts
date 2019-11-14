import { Model, DataTypes } from 'sequelize';  
import {connection} from '../sequelize';

class Task extends Model {
    public id!: number;
    public name!: string;
    public description!: string;
    public timeLimit!: number;
    public matchId!: number;
}

Task.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        defaultValue: 'Название задания'
    },
    description: {
        type: DataTypes.TEXT,
        defaultValue: 'Описание задания'
    },
    timeLimit: {
        type: DataTypes.INTEGER,
        defaultValue: 20
    },
    matchId: {
        type: DataTypes.INTEGER
    }
}, {
    sequelize: connection, modelName: 'task'
})

export default Task

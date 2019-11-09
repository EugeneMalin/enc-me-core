import { Model, DataTypes } from 'sequelize';  
import sequelize from '../sequelize';

class Task extends Model {
    public id!: number;
    public name!: string;
    public description!: string;
    public timeLimit!: number;
}

Task.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
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
    }
}, {
    sequelize, modelName: 'task'
})

export default Task

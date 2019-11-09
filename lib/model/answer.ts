import { Model, DataTypes } from 'sequelize';  
import sequelize from '../sequelize';

class Answer extends Model {
    public id!: number;
    public value!: string;
    public taskId!: string;
}

Answer.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false
    },
    taskId: {
        type: DataTypes.INTEGER,
    }
}, {
    sequelize, modelName: 'answer'
})

export default Answer;

import { Model, DataTypes } from 'sequelize';  
import {connection} from '../sequelize';

class Hint extends Model {
    public id!: number;
    public value!: string;
    public timeDelay!: number;
    public taskId!: number;
}

Hint.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    value: {
        type: DataTypes.TEXT
    },
    timeDelay: {
        type: DataTypes.INTEGER
    },
    taskId: {
        type: DataTypes.INTEGER
    }
}, {
    sequelize: connection, modelName: 'hint' 
})

export default Hint;

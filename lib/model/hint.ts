import {connection} from "../sequelize";
import { Model, DataTypes } from 'sequelize';  

class Hint extends Model {
    public id!: number
    public text!: string
    public timeDelay!: number
    public taskId!: number
}

Hint.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    text: {
        type: DataTypes.STRING,
        defaultValue: 'Текст с непрямым указанием на ответ'
    },
    timeDelay: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    taskId: DataTypes.INTEGER
}, {
    modelName: 'hint', sequelize: connection
})

export default Hint;

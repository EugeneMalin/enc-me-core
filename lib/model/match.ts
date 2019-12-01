import {connection} from "../sequelize";
import { Model, DataTypes } from 'sequelize';  

class Match extends Model {
    public id!: string
    public authorId!: number
    public description!: string
    public startAt!: Date
    public teamsLimit!: number
    public isClosed!: boolean
}

Match.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    authorId: DataTypes.INTEGER,
    description: {
        type: DataTypes.TEXT,
        defaultValue: 'Уточняющее описание для игры.'
    },
    startAt: DataTypes.DATE,
    teamsLimit: DataTypes.INTEGER,
    isClosed: DataTypes.BOOLEAN
}, {
    modelName: 'match', sequelize: connection
})

export default Match;

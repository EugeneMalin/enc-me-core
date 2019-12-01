import {connection} from "../sequelize";
import { Model, DataTypes } from 'sequelize';  

class MatchParticipant extends Model {
    public id!: number
    public groupId!: string
    public matchId!: string
}

MatchParticipant.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    groupId: {
        type: DataTypes.UUID,
        defaultValue: null,
        allowNull: true
    },
    matchId: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    modelName: 'matchparticipant', sequelize: connection
})

export default MatchParticipant;

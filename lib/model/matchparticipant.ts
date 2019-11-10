import { Model, DataTypes } from "sequelize";
import sequelize from '../sequelize'

class MatchParticipant extends Model {
    public id!: number;
    public teamId!: number;
    public gamerId!: number;
    public matchId!: number;
}

MatchParticipant.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    teamId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    gamerId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    matchId: DataTypes.INTEGER
}, {
    modelName: 'matchparticipant', sequelize
})

export default MatchParticipant;

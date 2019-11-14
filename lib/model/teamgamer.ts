import { Model, DataTypes } from 'sequelize';  
import {connection} from '../sequelize';

class TeamGamer extends Model {
    public id!: number;
    public gamerId!: number;
    public teamId!: number;
}

TeamGamer.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    gamerId: {
        type: DataTypes.INTEGER
    },
    teamId: {
        type: DataTypes.INTEGER
    }
}, {
    modelName: 'teamgamer', sequelize: connection
})

export default TeamGamer;

import { Model, DataTypes } from 'sequelize';  
import {connection} from '../sequelize';

class Team extends Model {
    public id!: number;
    public name!: string;
    public bio!: string;
    public masterId!: number;
}

Team.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING
    },
    bio: {
        type: DataTypes.TEXT
    },
    masterId: {
        type: DataTypes.INTEGER
    }
}, {
    sequelize: connection, modelName: 'team'
})

export default Team;
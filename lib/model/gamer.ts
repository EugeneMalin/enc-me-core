import { Model, DataTypes } from 'sequelize';  
import sequelize from '../sequelize';

class Gamer extends Model {
    public id!: number;
    public userId!: number;
    public points!: number;
    public bio!: string;
}

Gamer.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    bio: {
        type: DataTypes.TEXT
    }
}, {
    modelName: 'gamer', sequelize
})

export default Gamer;

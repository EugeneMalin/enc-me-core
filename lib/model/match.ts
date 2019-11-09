import { Model, DataTypes } from 'sequelize';  
import sequelize from '../sequelize';

enum MatchState {
    Created,
    Full,
    Started,
    Ended,
    Closed
}

class Match extends Model {
    public id!: number;
    public authorId!: number;
    public name!: string;
    public description!: string;
    public startAt!: Date;
    public endAt!: Date;
    public regEndAt!: Date;
    public teamsLimit!: number;
    public state!: MatchState;
}

Match.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    authorId: {
        type: DataTypes.INTEGER
    },
    name: {
        type: DataTypes.STRING
    },
    description: {
        type: DataTypes.TEXT
    },
    startAt: {
        type: DataTypes.DATE
    },
    endAt: {
        type: DataTypes.DATE
    },
    regEndTime: {
        type: DataTypes.DATE
    },
    teamsLimit: {
        type: DataTypes.INTEGER
    },
    state: {
        type: DataTypes.INTEGER,
        defaultValue: MatchState.Created
    },
}, {
    sequelize, modelName: 'match',
});

export default Match
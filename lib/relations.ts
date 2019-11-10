import Task from "./model/task";
import Answer from "./model/answer";
import Match from "./model/match";
import Hint from "./model/hint";
import Team from "./model/team";
import Gamer from "./model/gamer";
import TeamGamer from "./model/teamgamer";

// One task can have many answers
Task.hasMany(Answer)
// One answer should have task
Answer.belongsTo(Task, {foreignKey: 'taskId'});
// One task can have many hints
Task.hasMany(Hint);
// One hint should have task
Hint.belongsTo(Task, {foreignKey: 'taskId'});

// One match can have many tasks
Match.hasMany(Task)
// One task should have Match
Task.belongsTo(Match, {foreignKey: 'matchId'});

// One team has one capitain
Team.belongsTo(Gamer)
Team.belongsToMany(Gamer, {
    through: {
        model: TeamGamer,
        unique: false,
    },
    foreignKey: 'teamId'
})
// Team contains many gamers
Team.belongsToMany(Gamer, {
    through: {
        model: TeamGamer,
        unique: false
    },
    foreignKey: 'teamId'
})
// Gamer can be in several commands
Gamer.belongsToMany(Team, {
    through: {
        model: TeamGamer,
        unique: true
    },
    foreignKey: 'gamerId'
})
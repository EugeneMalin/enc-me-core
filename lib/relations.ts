import Task from "./model/task";
import Answer from "./model/answer";
import Match from "./model/match";

// One task can have many answers
Task.hasMany(Answer)
// One answer should have any task
Answer.belongsTo(Task, {foreignKey: 'taskId'});
// One match can have many tasks
Match.hasMany(Task)
// One task should have any Match
Task.belongsTo(Match, {foreignKey: 'matchId'});

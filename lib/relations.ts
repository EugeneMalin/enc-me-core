import Task from "./model/task";
import Answer from "./model/answer";
import Match from "./model/match";
import Hint from "./model/hint";

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

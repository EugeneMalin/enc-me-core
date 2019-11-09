import Task from "./model/task";
import Answer from "./model/answer";

Task.hasMany(Answer)
Answer.belongsTo(Task, {foreignKey: 'taskId'});

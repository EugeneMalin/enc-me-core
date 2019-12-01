import User from './model/user'
import Message from './model/message'
import Group from './model/group'
import Member from './model/member'
import Task from './model/task'
import Match from './model/match'
import Answer from './model/answer'
import MatchParticipant from './model/matchparticipant'
import Hint from './model/hint'

User.hasMany(Answer);
Answer.belongsTo(User);

User.hasMany(Message);
Message.belongsTo(User, {
    foreignKey: 'userId'
})
Group.hasMany(Message);
Message.belongsTo(Group, {
    foreignKey: 'groupId'
})

Member.belongsTo(User, {
    foreignKey: 'memberId'
});

Group.hasMany(Member);
Member.belongsTo(Group, {
    foreignKey: 'groupId'
});

Task.hasMany(Hint)
Hint.belongsTo(Task, {
    foreignKey: 'taskId'
})

Match.hasMany(Task)
Task.belongsTo(Match, {
    foreignKey: 'matchId'
})

Match.belongsToMany(Group, {
    through: {
        model: MatchParticipant,
        unique: false
    },
    foreignKey: 'matchId'
})
Group.belongsToMany(Match, {
    through: {
        model: MatchParticipant,
        unique: false
    },
    foreignKey: 'groupId'
})

export {
    User,
    Message,
    Group,
    Member
}
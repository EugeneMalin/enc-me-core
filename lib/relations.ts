import User from './model/user'
import Message from './model/message'
import Group from './model/group'
import Member from './model/member'

Group.hasMany(Message);
User.hasMany(Message);
Message.belongsTo(User, {
    foreignKey: 'userId'
})

User.belongsTo(Member);

Group.hasMany(Member);
Member.belongsTo(Group);

export {
    User,
    Message,
    Group,
    Member
}
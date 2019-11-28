import User from './model/user'
import Message from './model/message'
import Group from './model/group'
import Member from './model/member'

User.hasMany(Message);
Message.belongsTo(User, {
    foreignKey: 'userId'
})

Member.belongsTo(User);

Group.hasMany(Member);
Member.belongsTo(Group);

export {
    User,
    Message,
    Group,
    Member
}
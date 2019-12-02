import User from './model/user'
import Message from './model/message'
import Answer from './model/answer'

User.hasMany(Answer);
Answer.belongsTo(User);

User.hasMany(Message);
Message.belongsTo(User, {
    foreignKey: 'userId'
})

export {
    User,
    Message,
    Answer
}
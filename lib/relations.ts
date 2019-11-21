import Conversation from './model/conversation'
import User from './model/user'
import Message from './model/message'

User.hasMany(Conversation);
Conversation.belongsTo(User, { as: 'user1' });
Conversation.belongsTo(User, { as: 'user2' });
Message.belongsTo(Conversation, {
    foreignKey: 'conversationId'
});
Conversation.hasMany(Message);
User.hasMany(Message);
Message.belongsTo(User, {
    foreignKey: 'userId'
})

export {
    Conversation,
    User,
    Message
}
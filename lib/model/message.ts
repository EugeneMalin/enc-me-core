import { Model, DataTypes } from 'sequelize';  
import {connection} from '../sequelize';
import {Conversation, User} from '../relations';
class Message extends Model {
    public id!: string;
    public text!: string;
    public userId!: number;
    public createdAt!: Date;
    public conversationId!: string;
    public user!: {
        _id: number,
        name: string
    };

    async markUser(): Promise<Message> {
        const user = await User.findOne({
            where: {
                id: this.userId
            }
        });
        this.user = {
            _id: user && user.id || -1,
            name: user && user.username || 'DELETED USER'
        };
        return this;
    }

    setConversation(connection: Conversation): Promise<Message> {
        this.conversationId = connection.id;
        return this.save();
    }

    //TODO надо добавить метод в котором для пользователя будет {_id, name}

    static async createMessage(text: string, senderId: number, receiverId: number): Promise<Message> {
        const [message, conversation] = await Promise.all([
            Message.create({
                text,
                userId: senderId
            }),
            Conversation.findOrCreateConversation(senderId, receiverId)
        ]);
        return await message.setConversation(conversation);
    };
}

Message.init({
    text: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    }
}, {
    sequelize: connection, modelName: 'message' 
})

export default Message;

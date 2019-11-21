import { Model, DataTypes } from 'sequelize';  
import {connection} from '../sequelize';
import {Conversation} from '../relations';
class Message extends Model {
    public id!: string;
    public text!: string;
    public teamId!: number;
    public userId!: number;
    public createdAt!: Date;
    public conversationId!: string;

    setConversation(connection: Conversation): Promise<Message> {
        this.conversationId = connection.id;
        return this.update(this);
    }

    async createMessage(text: string, senderId: number, receiverId: number): Promise<Message> {
        const [message, conversation] = await Promise.all([
            Message.create({
                text,
                userId: senderId
            }),
            Conversation.findOrCreateConversation(senderId, receiverId)
        ]);
        //@ts-ignore
        return await message.setConversation(conversation);
    };
}

Message.init({
    text: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    teamId: DataTypes.INTEGER,
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    }
}, {
    sequelize: connection, modelName: 'message' 
})

export default Message;

import { Model, DataTypes } from 'sequelize';  
import {connection} from '../sequelize';
import {User} from '../relations';
class Message extends Model {
    public id!: string;
    public text!: string;
    public userId!: number;
    public groupId!: number;
    public createdAt!: Date;
    public user!: {
        _id: number,
        name: string
    };

    mark(user: User|null): Message {
        this.user = {
            _id: user && user.id || -1,
            name: user && user.username || 'DELETED USER'
        };
        return this;
    }

    async markUser(): Promise<Message> {
        const user = await User.findOne({
            where: {
                id: this.userId
            }
        });
        this.mark(user)
        return this;
    }

    static async createMessage(text: string, senderId: number, groupId: number|null = null): Promise<Message> {
        return Message.create({
            text,
            userId: senderId,
            groupId
        })
    };
}

Message.init({
    text: DataTypes.TEXT,
    userId: DataTypes.INTEGER,
    groupId: DataTypes.INTEGER,
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    }
}, {
    sequelize: connection, modelName: 'message' 
})

export default Message;

import {connection} from "../sequelize";
import { Model, DataTypes, Op } from 'sequelize';  
import {Message, User} from "../relations";

class Conversation extends Model {
    public id!: string;
    public messages!: Message[]

    getMessages(): Promise<{text: string, user: {_id: number, name: string}}[]> {
      return Promise.all((this.messages || []).map(msg => msg.markUser())).then((msgs: Message[]) => {        
        return msgs.map(m => {
          return {text: m.text, user: m.user}
        })
      });
    }

    static findOrCreateConversation(user1Id: number, user2Id: number): Promise<Conversation> {
        return Conversation.findOne({
          where: {
            user1Id: {
              [Op.or]: [user1Id, user2Id]
            },
            user2Id: {
              [Op.or]: [user1Id, user2Id]
            }
          },
          include: [ Message ],
          order: [[ Message, 'createdAt', 'DESC' ]]
        })
          .then(conversation => {
            if(conversation) {
              return conversation;
            } else {
              return Conversation.create({
                user1Id: user1Id,
                user2Id: user2Id
              }, {
                include: [ Message ]
              });
        }
        });
    }
}

Conversation.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    }
}, {
    modelName: 'conversation', sequelize: connection
})

export default Conversation;

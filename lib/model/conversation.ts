import {connection} from "../sequelize";
import { Model, DataTypes, Op } from 'sequelize';  
import {Message} from "../relations";

class Conversation extends Model {
    public id!: string;

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

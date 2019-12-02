
import { Socket } from "socket.io";
import { User, Message } from '../relations';
import { IMobileSockets } from "../sequelize";

export default function appendListners(socket: Socket, BOT: User, mobileSockets: {[key: string]: IMobileSockets}) {
    socket.on('initBot', () => {
        socket.broadcast.emit('showMessage', {
            message: 'Bot доступен',
            type: 'info'
        });
        mobileSockets[BOT.id] = {
            socket: socket.id,
            member: null
        }
    })
    socket.on('answerBot', ({token, answer}) => {
        Message.createMessage(answer, BOT.id, token)
            .then(message => message.markUser())
            .then(message => {
                Object.keys(mobileSockets).forEach(userId => {
                    const member = mobileSockets[userId].member
                    if (member && member.groupId === token) {
                        const receiverSocketId = mobileSockets[userId].socket;
                        
                        socket.to('' + receiverSocketId).emit('incomingMessage', {
                            text: message.text, 
                            createdAt: message.createdAt, 
                            user: {_id: BOT.id, name: "BOT"},
                            _id: message.id
                        });
                    }
                })
            })
        
    })
}
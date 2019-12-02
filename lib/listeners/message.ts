import { Socket } from "socket.io";
import { User, Message, Member } from '../relations';
import { IMobileSockets } from "../sequelize";
import { Op } from 'sequelize';

export default function appendListners(socket: Socket, mobileSockets: {[key: string]: IMobileSockets}) {
    socket.on('chat', ({user}) => {
        User.findAll({
            where: {
                teamToken: user.teamToken
            },
            include: [Message]
        }).then(users => {
            const messages: Message[] = [];
            users.forEach(user => {
                messages.push(...user.messages.filter(msg => msg.groupId === user.teamToken).map(msg => msg.mark(user)))
            })
            messages.sort((a, b) => {
                return b.createdAt.getTime() - a.createdAt.getTime()
            })
            socket.emit('priorMessages', {messages: messages.map(message => {
                return {
                    _id: message.id,
                    text: message.text,
                    user: message.user,
                    createdAt: message.createdAt
                }
            })});
        })
    });
    socket.on('message', ({ text, sender }) => {
        Message.createMessage(text, sender.id, sender.teamToken)
            .then(message => message.markUser())
            .then(message => {
                socket.emit('incomingMessage', {
                    text: message.text, 
                    user: message.user, 
                    createdAt: message.createdAt,
                    _id: message.id
                });
                Object.keys(mobileSockets).forEach(userId => {
                    if (mobileSockets[userId].teamToken === sender.teamToken) {
                        const receiverSocketId = mobileSockets[userId].socket;
                        socket.to('' + receiverSocketId).emit('incomingMessage', {
                            text: message.text, 
                            user: message.user,
                            createdAt: message.createdAt,
                            _id: message.id
                        });
                    }
                })
                if (text && text.indexOf('/') === 0) {
                    const textUnits = text.split(' ')
                    socket.broadcast.emit('runBot', {command: textUnits[0], commandParams: [...textUnits.slice(1)], token: sender.teamToken, user: sender});
                }
            })
    });
}
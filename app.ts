import socket, { Server } from 'socket.io';
import http from 'http';

import config from './lib/config';
import logger from './lib/log';

import {connection, IMobileSockets} from './lib/sequelize'
import './lib/relations';
import { User, Group, Member, Message } from './lib/relations';
import { Op } from 'sequelize';

import addUserListners from './lib/listeners/user'
import addTeamListners from './lib/listeners/team'

const io: Server = socket(http.createServer().listen(config.get('socketPort')));

const mobileSockets: {[key: string]: IMobileSockets} = {};

connection.sync().then(() => {
    User.findOrCreate({
        where: {
            username: 'bot',
            firstName: 'Бот',
            lastName: 'Ассистент'
        }
    }).then(([BOT]) => {
        io.on('connection', socket => {
            addUserListners(socket, mobileSockets)
        
            addTeamListners(socket, BOT);
            
            socket.on('chat', ({group}) => {
                Member.findAll({where: {
                    groupId: group.id
                }}).then(members => {
                    User.findAll({
                        where: {
                            id: {[Op.in]: members.map(member => member.userId)}
                        },
                        include: [Message]
                    }).then(users => {
                        const messages: Message[] = [];
                        users.forEach(user => {
                            messages.push(...user.messages.filter(msg => msg.groupId === group.id).map(msg => msg.mark(user)))
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
            });
            socket.on('message', ({ text, sender, group }) => {
                Message.createMessage(text, sender.id, group.id)
                    .then(message => message.markUser())
                    .then(message => {
                        socket.emit('incomingMessage', {
                            text: message.text, 
                            user: message.user, 
                            createdAt: message.createdAt,
                            _id: message.id
                        });
                        Object.keys(mobileSockets).forEach(userId => {
                            const member = mobileSockets[userId].member
                            if (member && member.groupId === group.id) {
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
                            socket.broadcast.emit('runBot', {command: textUnits[0], commandParams: [...textUnits.slice(1)], token: group.id, user: sender});
                        }
                    })
            });
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
            socket.on('enterGame', ({user, game}) => {

            })
            socket.on('createGame', ({user, game}) => {

            })
            socket.on('createGame', ({user, game}) => {

            })
        })    
    })
})

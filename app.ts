import socket, { Server } from 'socket.io';
import http from 'http';

import config from './lib/config';
import logger from './lib/log';

import {connection, IMobileSockets} from './lib/sequelize'
import './lib/relations';
import { User, Group, Member, Message } from './lib/relations';
import { IUser } from './lib/model/user';
import { Op } from 'sequelize';

import addUserListners from './lib/listeners/user'


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
        
            socket.on('createTeam', (credentials: {user: IUser, group: {name: string, idClosed: boolean}}) => {
                if (!credentials.user.id) {
                    return;
                }
                
                Promise.all([
                    User.findByPk(credentials.user.id),
                    Member.findOne({
                        where: {
                            userId: credentials.user.id
                        }
                    })
                ]).then(([user, member])=> {
                    if (!user) {
                        socket.emit('showMessage', {
                            message: `Пользователь ${credentials.user.username} не существует.`,
                            type: 'danger',
                            kind: 'auth'
                        });
                        return;
                    }
                    if (!member) {
                        return Promise.all([
                            Member.create({isCaptain: true, isBot: false}),
                            Member.create({isCaptain: false, isBot: true}),
                            Group.create(credentials.group)
                        ]).then(([member, botMember, group]) =>{
                            member.userId = user.id
                            botMember.userId = BOT.id
                            botMember.groupId = group.id
                            member.groupId = group.id
                            return Promise.all([group.save(), member.save(), user.save(), botMember.save()])
                        }).then(([group, member, user]) => {
                            Promise.all([
                                User.findByPk(credentials.user.id),
                                Group.findAll()
                            ]).then(([user, groups]) => {
                                if (user && groups) {
                                    socket.emit('groupCreated', {group: groups.find(group => group.id === member.groupId), user, groups, member})
                                    socket.broadcast.emit('teamsUpdated', {groups, group, user, member})
                                }
                            })
                        })
                    }
                    if (!member.isCaptain) {
                        socket.emit('showMessage', {
                            message: `Пользователь ${credentials.user.username} управляет командой.`,
                            type: 'danger',
                            kind: 'auth'
                        });
                        return 
                    }
                    if (!member) {
                        socket.emit('showMessage', {
                            message: `Пользователь ${credentials.user.username} состоит в команде.`,
                            type: 'danger',
                            kind: 'auth'
                        });
                        return 
                    }
                })
            });
        
            socket.on('joinToTeam', (credentials: {user: IUser, group: Group}) => {
                if (!credentials.user.id) {
                    return;
                }
                Promise.all([
                    User.findByPk(credentials.user.id),
                    Member.findOne({
                        where: {
                            userId: credentials.user.id
                        }
                    })
                ]).then(([user, member]) => {
                    if (!user) {
                        socket.emit('showMessage', {
                            message: `Пользователь ${credentials.user.username} не существует.`,
                            type: 'danger',
                            kind: 'auth'
                        });
                        return;
                    }
                    if (!member) {
                        return Promise.all([
                            Member.create({isCaptain: false, isBot: false}),
                            Group.findByPk(credentials.group.id)
                        ]).then(([member, group]) => {
                            if (!member) {
                                socket.emit('showMessage', {
                                    message: `Упс! Что-то пошло не так, но мы уже об этом знаем.`,
                                    type: 'danger',
                                    kind: 'auth'
                                });
                                return
                            }
                            if (!group) {
                                socket.emit('showMessage', {
                                    message: `Команда ${credentials.group.name} уже не существует.`,
                                    type: 'danger',
                                    kind: 'auth'
                                });
                                //todo надо вызвать мульти удаление этой команды
                                return
                            }
                            if (group.isClosed) {
                                socket.emit('showMessage', {
                                    message: `Команда ${credentials.group.name} закрыта для добавления.`,
                                    type: 'danger',
                                    kind: 'auth'
                                });
                                //todo надо вызвать мульти удаление этой команды
                                return
                            }
                            member.userId = user.id
                            member.groupId = group.id
                            return Promise.all([group.save(), member.save(), user.save()])
                        }).then((storedValues) => {
                            Promise.all([
                                User.findByPk(credentials.user.id),
                            ]).then(([user]) => {
                                if (user) {
                                    socket.emit('groupExtended', {user, group: storedValues && storedValues[0], member: storedValues && storedValues[1]})
                                    socket.broadcast.emit('membersUpdated', {group: storedValues && storedValues[0] || null, user, member: storedValues && storedValues[1]})
                                }
                            })
                        })
                    }
                    if (!member.isCaptain) {
                        socket.emit('showMessage', {
                            message: `Пользователь ${credentials.user.username} управляет командой.`,
                            type: 'danger',
                            kind: 'auth'
                        });
                        return 
                    }
                    if (!member) {
                        socket.emit('showMessage', {
                            message: `Пользователь ${credentials.user.username} состоит в команде.`,
                            type: 'danger',
                            kind: 'auth'
                        });
                        return 
                    }
                })
            });
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

import socket, { Server } from 'socket.io';
import http from 'http';

import config from './lib/config';
import logger from './lib/log';

import {connection} from './lib/sequelize'
import './lib/relations';
import { User, Group, Member, Message } from './lib/relations';
import { IUser } from './lib/model/user';
import { Op } from 'sequelize';


const io: Server = socket(http.createServer().listen(config.get('socketPort')));

interface IMobileSockets {
    socket: string,
    member: Member | null
}

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
            const uploadUser = (user: User, member: Member|null, group: Group|null, groups: Group[]|null) => {
                mobileSockets[user.id] = {
                    socket: socket.id,
                    member: member
                }
                socket.emit('dataUploaded', {user, group, member, groups, game: null});
            }
        
            // создание пользователя по полным данным
            socket.on('createUser', (credentials: {
                username: string,
                password: string,
                email: string,
                firstName: string,
                lastName: string
            }) => {
                const userDraft = User.getDraft(credentials.username, credentials.password)
                const emitUser = (user: User) => {
                    socket.emit('userCreated', { user });
                }
                userDraft.email = credentials.email
                userDraft.firstName = credentials.firstName
                userDraft.lastName = credentials.lastName
                User.findOne({
                    where: {
                        username: userDraft.username
                    }
                }).then((user) => {
                    if (!user) {
                        User.create(userDraft).then(newUser => emitUser(newUser))
                        socket.emit('showMessage', {
                            message: `Пользователь ${credentials.username} создан.`,
                            type: 'success',
                            kind: 'creation'
                        });
                    } else {
                        socket.emit('showMessage', {
                            message: `Пользователь ${credentials.username} уже существует.`,
                            type: 'danger',
                            kind: 'creation'
                        });
                    }
                })
            });
        
            // вход пользователя по паролю и логину
            socket.on('enterUser', (credentials: {
                username: string,
                password: string
            }) => {
                Promise.all([
                    User.findOne({
                        where: {
                            username: credentials.username
                        },
                    }), 
                    Group.findAll()
                ]).then(([user, groups]) => {
                    if (user) {
                        if (user.check(credentials.password)) {
                            Member.findOne({
                                where: {
                                    userId: user.id
                                }
                            }).then((member) => {
                                if (member) {
                                    return Group.findByPk(member.groupId).then(group => {
                                        uploadUser(user, member, group, groups);
                                    })
                                }
                                uploadUser(user, null, null, groups);
                            })
                        } else {
                            socket.emit('showMessage', {
                                message: `Неправильный пароль для ${credentials.username}.`,
                                type: 'danger',
                                kind: 'auth'
                            });
                        }
                    } else {
                        socket.emit('showMessage', {
                            message: `Пользователь ${credentials.username} не существует.`,
                            type: 'danger',
                            kind: 'auth'
                        });
                    }
                })
            });
        
            // догрузка данных пользователя по хешированнному ключу
            socket.on('uploadUser', (credentials: {
                username: string,
                hashedPassword: string
            }) => {
                Promise.all([
                    User.findOne({
                        where: {
                            username: credentials.username
                        }
                    }), 
                    Group.findAll()
                ]).then(([user, groups]) => {
                    if (user) {
                        if (user.hashedPassword === credentials.hashedPassword) {
                            Member.findOne({
                                where: {
                                    userId: user.id
                                }
                            }).then((member) => {
                                if (member) {
                                    return Group.findByPk(member.groupId).then(group => {
                                        uploadUser(user, member, group, groups);
                                    })
                                }
                                uploadUser(user, null, null, groups);
                            })
                        } else {
                            socket.emit('showMessage', {
                                message: `Неправильный пароль для ${credentials.username}.`,
                                type: 'danger',
                                kind: 'auth'
                            });
                        }
                    } else {
                        socket.emit('showMessage', {
                            message: `Пользователь ${credentials.username} не существует.`,
                            type: 'danger',
                            kind: 'auth'
                        });
                    }
                })
            });
        
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
                            messages.push(...user.messages.map(msg => msg.mark(user)))
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
                Message.createMessage(text, sender.id)
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
                Message.createMessage(answer, BOT.id)
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
        })    
    })
})

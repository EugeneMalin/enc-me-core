import socket, { Server } from 'socket.io';
import http from 'http';

import config from './lib/config';
import logger from './lib/log';

import {connection} from './lib/sequelize'
import './lib/relations';
import { User, Group, Member, Message } from './lib/relations';
import { IUser } from './lib/model/user';
import { Op } from 'sequelize';

connection.sync();

const io: Server = socket(http.createServer().listen(config.get('socketPort')));

interface IMobileSockets {
    socket: string,
    member: Member | null
}

const mobileSockets: {[key: string]: IMobileSockets} = {};

io.on('connection', socket => {
    const uploadUser = (user: User, group: Group|null, groups: Group[]|null) => {
        mobileSockets[user.id] = {
            socket: socket.id,
            member: user.member
        }
        socket.emit('userUploaded', {user, group, groups});
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
            },
            include: [Member]
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
                include: [Member]
            }), 
            Group.findAll()
        ]).then(([user, groups]) => {
            if (user) {
                if (user.check(credentials.password)) {
                    if (user.member) {
                        return Group.findByPk(user.member.groupId).then(group => {
                            uploadUser(user, group, groups);
                        })
                    }
                    uploadUser(user, null, groups);
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
                },
                include: [Member]
            }), 
            Group.findAll()
        ]).then(([user, groups]) => {
            if (user) {
                if (user.hashedPassword === credentials.hashedPassword) {
                    if (user.member) {
                        return Group.findByPk(user.member.groupId).then(group => {
                            uploadUser(user, group, groups);
                        })
                    }
                    uploadUser(user, null, groups);
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
        User.findByPk(credentials.user.id, {include: [Member]}).then(user => {
            if (!user) {
                socket.emit('showMessage', {
                    message: `Пользователь ${credentials.user.username} не существует.`,
                    type: 'danger',
                    kind: 'auth'
                });
                return;
            }
            if (!user.member) {
                return Promise.all([
                    Member.create({isCaptain: true}),
                    Group.create(credentials.group)
                ]).then(([member, group]) =>{
                    user.memberId = member.id
                    member.groupId = group.id
                    return Promise.all([group.save(), member.save(), user.save()])
                }).then(storedValues => {
                    Promise.all([
                        User.findByPk(credentials.user.id, {include: [Member]}),
                        Group.findAll()
                    ]).then(([user, groups]) => {
                        if (user && groups) {
                            socket.emit('groupCreated', {group: groups.find(group => group.id === user.member.groupId), user, groups})
                            socket.broadcast.emit('teamsUpdated', {groups})
                        }
                    })
                })
            }
            if (!user.member.isCaptain) {
                socket.emit('showMessage', {
                    message: `Пользователь ${credentials.user.username} управляет командой.`,
                    type: 'danger',
                    kind: 'auth'
                });
                return 
            }
            if (!user.member) {
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
        User.findByPk(credentials.user.id, {include: [Member]}).then(user => {
            if (!user) {
                socket.emit('showMessage', {
                    message: `Пользователь ${credentials.user.username} не существует.`,
                    type: 'danger',
                    kind: 'auth'
                });
                return;
            }
            if (!user.member) {
                return Promise.all([
                    Member.create({isCaptain: false}),
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
                    user.memberId = member.id
                    member.groupId = group.id
                    return Promise.all([group.save(), member.save(), user.save()])
                }).then((storedValues) => {
                    Promise.all([
                        User.findByPk(credentials.user.id, {include: [Member]}),
                    ]).then(([user]) => {
                        if (user) {
                            socket.emit('groupExtended', {user, group: storedValues && storedValues[0]})
                            socket.broadcast.emit('membersUpdated', {group: storedValues && storedValues[0] || null, user})
                        }
                    })
                })
            }
            if (!user.member.isCaptain) {
                socket.emit('showMessage', {
                    message: `Пользователь ${credentials.user.username} управляет командой.`,
                    type: 'danger',
                    kind: 'auth'
                });
                return 
            }
            if (!user.member) {
                socket.emit('showMessage', {
                    message: `Пользователь ${credentials.user.username} состоит в команде.`,
                    type: 'danger',
                    kind: 'auth'
                });
                return 
            }
        })
    });
    socket.on('chat', group => {
        Group.findByPk(group.id, {include: [Member]}).then(group => {
            if (group) {
                User.findAll({
                    where: {
                        id: {[Op.contains]: group.members.map(member => member.id)}
                    },
                    include: [Message]
                }).then(users => {
                    const messages = users.map(user => {
                        return user.messages.map(msg => msg.mark(user))
                    }).flat()
                    socket.emit('priorMessages', {messages})
                })
            }
        });
    });
    socket.on('message', ({ text, sender, group }) => {
        Message.createMessage(text, sender.id)
            .then(message => message.markUser())
            .then(message => {
                socket.emit('incomingMessage', {text: message.text, user: message.user});
                Object.keys(mobileSockets).forEach(userId => {
                    const member = mobileSockets[userId].member
                    if (member && member.groupId === group.id) {
                        const receiverSocketId = mobileSockets[userId].socket;
                        socket.to('' + receiverSocketId).emit('incomingMessage', {text: message.text, user: message.user});
                    }
                })
                if (mobileSockets[-123]) {
                    socket.to(mobileSockets[-123].socket).emit('runBot', {command: message.text, token: group.id, user: message.user});
                }
            })
    });
    socket.on('initBot', () => {
        socket.broadcast.emit('showMessage', {
            message: 'Bot доступен',
            type: 'info'
        });
        mobileSockets[-123] = {
            socket: socket.id,
            member: null
        }
    })
    socket.on('answerBot', ({token, answer}) => {
        Object.keys(mobileSockets).forEach(userId => {
            const member = mobileSockets[userId].member
            if (member && member.groupId === token) {
                const receiverSocketId = mobileSockets[userId].socket;
                socket.to('' + receiverSocketId).emit('incomingMessage', {text: answer, user: {_id: -123, name: "BOOT"}});
            }
        })
    })
})

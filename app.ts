import socket, { Server } from 'socket.io';
import http from 'http';

import config from './lib/config';
import logger from './lib/log';

import {connection} from './lib/sequelize'
import './lib/relations';
import { User, Group, Member } from './lib/relations';
import { IUser } from './lib/model/user';
import { userInfo } from 'os';

connection.sync();

const io: Server = socket(http.createServer().listen(config.get('socketPort')));

const mobileSockets: {[key: string]: string|number} = {};



io.on('connection', socket => {
    const uploadUser = (user: User, groups: Group[]|null) => {
        mobileSockets[user.id] = socket.id
        socket.emit('userUploaded', { user, groups});
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
            mobileSockets[user.id] = socket.id
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
                    type: 'sucess',
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
                    uploadUser(user, groups);
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
                    uploadUser(user, groups);
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

    /*socket.on('chat', users => {
        Conversation.findOrCreateConversation(users.user.id, users.receiver.id)
            .then(conversation => {
                conversation.getMessages().then(msgs => socket.emit('priorMessages', msgs)); 
            });
    });
    socket.on('message', ({ text, sender, receiver }) => {
        Message.createMessage(text, sender.id, receiver.id)
            .then(message => message.markUser())
            .then(message => {
                socket.emit('incomingMessage', {text: message.text, user: message.user});
                const receiverSocketId = mobileSockets[receiver.id];
                socket.to('' + receiverSocketId).emit('incomingMessage', {text: message.text, user: message.user});
            })
    });*/
})

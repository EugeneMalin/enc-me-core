import socket, { Server } from 'socket.io';
import http from 'http';

import config from './lib/config';
import logger from './lib/log';

import {connection} from './lib/sequelize'
import './lib/relations';
import { User } from './lib/relations';

connection.sync();

const io: Server = socket(http.createServer().listen(config.get('socketPort')));

const mobileSockets: {[key: string]: string|number} = {};

io.on('connection', socket => {
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
            socket.broadcast.emit('createUser', user);
        }
        userDraft.email = credentials.email
        userDraft.firstName = credentials.firstName
        userDraft.lastName = credentials.lastName
        Promise.all([
            User.findOne({
                where: {
                    username: userDraft.username
                }
            })
        ]).then(([user]) => {
            if (!user) {
                User.create(userDraft).then(newUser => emitUser(newUser))
            } else {
                socket.emit('showMessage', {
                    message: `Пользователь ${credentials.username} уже существует.`,
                    type: 'danger',
                    kind: 'creation'
                });
            }
        })
    });

    socket.on('enterUser', (credentials: {
        username: string,
        password: string
    }) => {
        const emitUser = (user: User) => {
            mobileSockets[user.id] = socket.id
            socket.emit('userUploaded', { user });
            socket.broadcast.emit('enterUser', user);
        }
        Promise.all([
            User.findOne({
                where: {
                    username: credentials.username
                }
            })
        ]).then(([user]) => {
            if (user) {
                if (user.check(credentials.password)) {
                    emitUser(user);
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

    socket.on('uploadUser', (credentials: {
        username: string,
        hashedPassword: string
    }) => {
        const emitUser = (user: User) => {
            mobileSockets[user.id] = socket.id
            socket.emit('userUploaded', { user });
            socket.broadcast.emit('enterUser', user);
        }
        Promise.all([
            User.findOne({
                where: {
                    username: credentials.username
                }
            })
        ]).then(([user]) => {
            if (user) {
                if (user.hashedPassword === credentials.hashedPassword) {
                    emitUser(user);
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

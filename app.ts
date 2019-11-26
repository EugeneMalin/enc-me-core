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
        password: string
    }) => {
        const userDraft = User.getDraft(credentials.username, credentials.password)
        const emitUser = (user: User, users: User[] | null) => {
            mobileSockets[user.id] = socket.id
            socket.emit('userCreated', { user, users });
            socket.broadcast.emit('createUser', user);
        }
        Promise.all([
            User.findOne({
                where: {
                    username: userDraft.username
                }
            }),
            User.findAll()
        ]).then(([user, users]) => {
            if (!user) {
                User.create(userDraft).then(newUser => emitUser(newUser, users))
            } else {
                socket.emit('showMessage', {
                    message: `Пользователь ${credentials.username} уже существует.`,
                    type: 'danger',
                    kind: 'creation'
                });
            }
        })
    });

    socket.on('getUser', (credentials: {
        username: string,
        password: string
    }) => {
        const userDraft = User.getDraft(credentials.username, credentials.password)

        const emitUser = (user: User, users: User[] | null) => {
            mobileSockets[user.id] = socket.id
            socket.emit('userUploaded', { user, users });
            socket.broadcast.emit('getUser', user);
        }
        Promise.all([
            User.findOne({
                where: {
                    username: userDraft.username,
                    hashedPassword: userDraft.hashedPassword
                }
            }),
            User.findAll()
        ]).then(([user, users]) => {
            if (user) {
                emitUser(user, users)
            } else {
                socket.emit('showMessage', {
                    message: `Неправильные параметры входа для ${credentials.username}.`,
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

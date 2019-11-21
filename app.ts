import socket, { Server } from 'socket.io';
import http from 'http';

import config from './lib/config';
import logger from './lib/log';

import {connection} from './lib/sequelize'
import './lib/relations';
import { Conversation, User, Message } from './lib/relations';

connection.sync();

const io: Server = socket(http.createServer().listen(config.get('socketPort')));

const mobileSockets: {[key: string]: string|number} = {};

io.on('connection', socket => {
    socket.on('newUser', (credentials: {
        username: string,
        password: string
    }) => {
        const userDraft = User.getDraft(credentials.username, credentials.password)
        const emitUser = (user: User, users: User[] | null) => {
            mobileSockets[user.id] = socket.id
            socket.emit('userCreated', { user, users });
            socket.broadcast.emit('newUser', user, );
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
                emitUser(user, users)
            }
        })
    });
    socket.on('chat', users => {
        Conversation.findOrCreateConversation(users.user.id, users.receiver.id)
            .then(conversation => {
                Promise.all((conversation.messages || []).map(msg => msg.markUser())).then(msgs => socket.emit('priorMessages', msgs)); 
            });
    });
    socket.on('message', ({ text, sender, receiver }) => {
        Message.createMessage(text, sender.id, receiver.id)
            .then(message => {
                socket.emit('incomingMessage', message);
                const receiverSocketId = mobileSockets[receiver.id];
                socket.to('' + receiverSocketId).emit('incomingMessage', message);
            });
    });
})

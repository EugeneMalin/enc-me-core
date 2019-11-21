import bodyParser from 'body-parser';
import passport from 'passport';
import methodOverride from 'method-override';
import express from 'express';
import socket, { Server } from 'socket.io';
import http from 'http';
import cors from './lib/cors'

import config from './lib/config';
import logger from './lib/log';
import UserController from './lib/router/user'
import ClientController from './lib/router/client'
import MatchController from './lib/router/match'
import {connection} from './lib/sequelize';
import oauth from './lib/oauth';

import './lib/relations';
import './lib/auth';
import { Conversation, User, Message } from './lib/relations';

const server: express.Application = express();
const io: Server = socket(http.createServer().listen(config.get('socketPort')));

connection.sync();

server.use(cors);
server.use(methodOverride('X-HTTP-Method-Override'));
server.use(passport.initialize());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));

server.use('/api/client', ClientController);
server.use('/api/user', UserController);
server.use('/api/match', MatchController);

server.post('/api/token', oauth);

server.get('/api', (req, res) => {
    return res.send('Api is running on port: ' + config.get('port'));
})

server.get('/api/userInfo',
    passport.authenticate('bearer', { session: false }),
        (req, res) => {
            if (!req.user) {
                return res.send('There is no user');
            }
            
            // req.authInfo is set using the `info` argument supplied by
            // `BearerStrategy`.  It is typically used to indicate a scope of the token,
            // and used in access control checks.  For illustrative purposes, this
            // example simply returns the scope in the response.
            // @ts-ignore
            res.json({ user_id: req.user.userId, name: req.user.username, scope: req.authInfo.scope })
        }
);

server.listen(config.get('port'), function() {
    logger.info('Express server listening on port ' + config.get('port'));
});

const mobileSockets: {[key: string]: string|number} = {};

io.on('connection', socket => {
    socket.on('showHelp', ({foo}) => logger.info(`Need help for ${foo}`))

    server.get('/api/catch-help', function(req, res) {
        socket.broadcast.emit('needHelp', { foo: 'bar'})
        res.send('Help requested')
    })    

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
            .then(conversation => conversation.getMessages())
            .then(messages => socket.emit('priorMessages', messages));
    });
    socket.on('message', ({ text, sender, receiver }) => {
        Message.createMessage(text, sender, receiver)
            .then(message => {
                socket.emit('incomingMessage', message);
                const receiverSocketId = mobileSockets[receiver.id];
                socket.to('' + receiverSocketId).emit('incomingMessage', message);
            });
    });
})

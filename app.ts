import socket, { Server } from 'socket.io';
import http from 'http';

import config from './lib/config';
import logger from './lib/log';

import {connection, IMobileSockets} from './lib/sequelize'
import './lib/relations';
import { User } from './lib/relations';

import addUserListeners from './lib/listeners/user'
import addMessageListeners from './lib/listeners/message'
import addBotListeners from './lib/listeners/bot'

const io: Server = socket(http.createServer().listen(config.get('socketPort')));

const mobileSockets: {[key: string]: IMobileSockets} = {};
const teamStates: {[key: string]: number} = {}
connection.sync().then(() => {
    User.findOrCreate({
        where: {
            username: 'bot',
            firstName: 'Бот',
            lastName: 'Ассистент'
        }
    }).then(([BOT]) => {
        io.on('connection', socket => {
            const tasks: any[] = config.get('game');

            addUserListeners(socket, mobileSockets)
        
            addMessageListeners(socket, mobileSockets);

            addBotListeners(socket, BOT, mobileSockets);

            socket.on('updateGame', (team) => {
                const tasks: any[] = config.get('game');
                socket.emit('gameUpdated', {
                    game: config.get('game'), 
                    games: [config.get('game')],
                    task: tasks[teamStates[team.id]] || null
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

import socket, { Server } from 'socket.io';
import http from 'http';

import config from './lib/config';
import logger from './lib/log';

import {connection, IMobileSockets} from './lib/sequelize'
import './lib/relations';
import { User, Answer } from './lib/relations';

import addUserListeners from './lib/listeners/user'
import addMessageListeners from './lib/listeners/message'
import addBotListeners from './lib/listeners/bot'
import { get } from './lib/engine';

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

            const incomingTask = (res: string, socketId: string) => {
                const data = JSON.parse(res);
                const parsed: string[] = data['text'].split('\n').map((item: string) => item ? item.trim() : '')
                const cluesCount = parseInt(((parsed.shift()||'').split("(has")[1]||'0').trim())
                const question = parsed.shift();
                const min = Math.round(parseInt(data["span"]) / 60) || 0
                const sec = Math.round(parseInt(data["span"]) % 60) || 0
                const explanation = ((parsed.shift()||'').split(':')[1]||'').trim()
                const clues = parsed.length ? parsed.filter((item: string, index: number) => index % 2) : ['No clues']
                
                socket.emit('incomingTask', {
                    question,
                    clues,
                    cluesCount,
                    delay: {
                        min,
                        sec
                    },
                    explanation
                })
                socket.to(socketId).emit('incomingTask', {
                    question,
                    clues,
                    cluesCount,
                    delay: {
                        min,
                        sec
                    },
                    explanation
                })
            }

            socket.on('submitTask', ({user, answer}) => {
                get({}, `/api/gameTracking/checkAnswer/${user.teamToken}@${answer}@${user.gameId}`).then(res => {
                    const data = JSON.parse(res);
                    if (!data.isSuccess) {
                        //TODO добавить статитсику ответов
                        return socket.emit('showMessage', {
                            message: `${answer} is not right.`,
                            type: 'warning',
                            kind: 'answer',
                            code: 0
                        });
                    }
                    Object.keys(mobileSockets).forEach(userId => {
                        if (mobileSockets[userId].teamToken === user.teamToken) {
                            get({}, `/api/gameTracking/nextStep/${user.teamToken}@${user.gameId}`).then((res: string) => {
                                incomingTask(res, mobileSockets[userId].socket)
                            })
                        }
                    })
                    
                })
            })
            socket.on('updateTask', ({user}) => {
                get({}, `/api/gameTracking/nextStep/${user.teamToken}@${user.gameId}`).then((res: string) => {
                    Object.keys(mobileSockets).forEach(userId => {
                        if (mobileSockets[userId].teamToken === user.teamToken) {
                            get({}, `/api/gameTracking/nextStep/${user.teamToken}@${user.gameId}`).then((res: string) => {
                                incomingTask(res, mobileSockets[userId].socket)
                            })
                        }
                    })
                })
            })
        })    
    })
})

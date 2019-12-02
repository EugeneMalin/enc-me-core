import { Socket } from "socket.io";
import { User, Group, Member } from '../relations';
import { IMobileSockets } from "../sequelize";
import { post } from "../engine";

let level = 0

export default function appendListners(socket: Socket, mobileSockets: {[key: string]: IMobileSockets}) {
    const uploadUser = (user: User) => {
        mobileSockets[user.id] = {
            socket: socket.id,
            teamToken: user.teamToken
        }

        socket.emit('userUploaded', {
            user
        });
    }
    // вход пользователя по паролю и логину
    socket.on('enterUser', (credentials: {
        username: string,
        password: string
    }) => {
        if (!credentials) {
            return;
        }
        if (!credentials.username && !credentials.password) {
            return;
        }
        post({
            accountName: credentials.username,
            password: credentials.password
        }, '/api/account/signIn').then((res: string) => {
            const engineUser = JSON.parse(res);
            const userDraft = User.getDraft(credentials.username, credentials.password)
            engineUser.isSuccess ? Promise.all([
                User.findOrCreate({
                    where: {
                        username: credentials.username
                    },
                }), 
                Group.findAll()
            ]).then(([[user], groups]) => {
                if (user) {

                    user.token = engineUser.token
                    user.teamToken = engineUser.teamToken
                    user.hashedPassword = userDraft.hashedPassword
                    user.salt = userDraft.salt
                    user.firstName = engineUser.accountFirstName
                    user.lastName = engineUser.accountLastName
                    user.gameId = engineUser.games[0]

                    user.save().then(() => {
                        if (user.check(credentials.password)) {
                            uploadUser(user);
                        } else {
                            socket.emit('showMessage', {
                                message: `Неправильный пароль для ${credentials.username}.`,
                                type: 'danger',
                                kind: 'auth'
                            });
                        }
                    })
                } else {
                    socket.emit('showMessage', {
                        message: `Пользователь ${credentials.username} не существует.`,
                        type: 'danger',
                        kind: 'auth'
                    });
                }
            }) : socket.emit('showMessage', {
                message: `Неавторизованный в системе пользователь ${credentials.username}.`,
                type: 'danger',
                kind: 'auth'
            });
            
        })
    });

    // догрузка данных пользователя по хешированнному ключу
    socket.on('uploadUser', (credentials: {
        username: string,
        hashedPassword: string
    }) => {
        if (!credentials) {
            return;
        }
        if (!credentials.username && !credentials.hashedPassword) {
            return;
        }
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
                    uploadUser(user);
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
}
import { Socket } from "socket.io";
import { User, Group, Member } from '../relations';
import { IMobileSockets } from "../sequelize";

export default function appendListners(socket: Socket, mobileSockets: {[key: string]: IMobileSockets}) {
    const uploadUser = (user: User, member: Member|null, group: Group|null, groups: Group[]|null) => {
        mobileSockets[user.id] = {
            socket: socket.id,
            member: member
        }
        socket.emit('dataUploaded', {user, group, member, groups, game: null, games: []});
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
}
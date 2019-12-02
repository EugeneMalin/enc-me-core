
import { Socket } from "socket.io";
import { User, Group, Member } from '../relations';
import { IUser } from '../model/user';

export default function appendListners(socket: Socket, BOT: User) {
    socket.on('createTeam', (credentials: {user: IUser, group: {name: string, idClosed: boolean}}) => {
        if (!credentials.user.id) {
            return;
        }
        
        Promise.all([
            User.findByPk(credentials.user.id),
            Member.findOne({
                where: {
                    userId: credentials.user.id
                }
            })
        ]).then(([user, member])=> {
            if (!user) {
                socket.emit('showMessage', {
                    message: `Пользователь ${credentials.user.username} не существует.`,
                    type: 'danger',
                    kind: 'auth'
                });
                return;
            }
            if (!member) {
                return Promise.all([
                    Member.create({isCaptain: true, isBot: false}),
                    Member.create({isCaptain: false, isBot: true}),
                    Group.create(credentials.group)
                ]).then(([member, botMember, group]) =>{
                    member.userId = user.id
                    botMember.userId = BOT.id
                    botMember.groupId = group.id
                    member.groupId = group.id
                    return Promise.all([group.save(), member.save(), user.save(), botMember.save()])
                }).then(([group, member, user]) => {
                    Promise.all([
                        User.findByPk(credentials.user.id),
                        Group.findAll()
                    ]).then(([user, groups]) => {
                        if (user && groups) {
                            socket.emit('groupCreated', {group: groups.find(group => group.id === member.groupId), user, groups, member})
                            socket.broadcast.emit('teamsUpdated', {groups, group, user, member})
                        }
                    })
                })
            }
            if (!member.isCaptain) {
                socket.emit('showMessage', {
                    message: `Пользователь ${credentials.user.username} управляет командой.`,
                    type: 'danger',
                    kind: 'auth'
                });
                return 
            }
            if (!member) {
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
        if (!credentials.user.id) {
            return;
        }
        Promise.all([
            User.findByPk(credentials.user.id),
            Member.findOne({
                where: {
                    userId: credentials.user.id
                }
            })
        ]).then(([user, member]) => {
            if (!user) {
                socket.emit('showMessage', {
                    message: `Пользователь ${credentials.user.username} не существует.`,
                    type: 'danger',
                    kind: 'auth'
                });
                return;
            }
            if (!member) {
                return Promise.all([
                    Member.create({isCaptain: false, isBot: false}),
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
                    member.userId = user.id
                    member.groupId = group.id
                    return Promise.all([group.save(), member.save(), user.save()])
                }).then((storedValues) => {
                    Promise.all([
                        User.findByPk(credentials.user.id),
                    ]).then(([user]) => {
                        if (user) {
                            socket.emit('groupExtended', {user, group: storedValues && storedValues[0], member: storedValues && storedValues[1]})
                            socket.broadcast.emit('membersUpdated', {group: storedValues && storedValues[0] || null, user, member: storedValues && storedValues[1]})
                        }
                    })
                })
            }
            if (!member.isCaptain) {
                socket.emit('showMessage', {
                    message: `Пользователь ${credentials.user.username} управляет командой.`,
                    type: 'danger',
                    kind: 'auth'
                });
                return 
            }
            if (!member) {
                socket.emit('showMessage', {
                    message: `Пользователь ${credentials.user.username} состоит в команде.`,
                    type: 'danger',
                    kind: 'auth'
                });
                return 
            }
        })
    })
}
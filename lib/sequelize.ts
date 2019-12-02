import { Sequelize } from 'sequelize-typescript';  
import config from './config';
import { Member } from './relations';

const connection =  new Sequelize({
    database: config.get('postgres:credits:dbname'),
    dialect: 'postgres',
    username: config.get('postgres:credits:username'),
    password: config.get('postgres:credits:password'),
    storage: ':memory:',
    logging: process.env.NODE_ENV !== 'production'
})


export interface IMobileSockets {
    socket: string,
    teamToken: string | null
}

export {
    connection
};

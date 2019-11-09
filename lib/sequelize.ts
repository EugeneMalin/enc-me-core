import { Sequelize } from 'sequelize-typescript';  
import config from './config';

const sequelize =  new Sequelize({
    database: config.get('postgres:credits:dbname'),
    dialect: 'postgres',
    username: config.get('postgres:credits:username'),
    password: config.get('postgres:credits:password'),
    storage: ':memory:'
})

export default sequelize;

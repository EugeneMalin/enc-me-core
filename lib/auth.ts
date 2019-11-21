import config from './config';
import passport from 'passport';
import passportHttp from 'passport-http'
import passportOAuth from 'passport-oauth2-client-password'
import passportBearer from 'passport-http-bearer'
import Client from './model/client';
import AccessToken from './model/accesstoken';
import User from './model/user';
import logger from './log';

const BasicStrategy = passportHttp.BasicStrategy;
const ClientPasswordStrategy = passportOAuth.Strategy;
const BearerStrategy = passportBearer.Strategy;

passport.use(new BasicStrategy((username: string, password: string, done: Function) => {
    return Client.findOne({
        where: { id: username }
    }).then((client: Client|null) => {
        logger.info('Get client ' + client)

        if (!client) { return done(null, false); }
        if (client.clientSecret != password) { return done(null, false); }

        return done(null, client);
    });
}));

passport.use(new ClientPasswordStrategy((clientId: string, clientSecret: string, done: Function) => {
    return Client.findOne({
        where: { id: clientId }
    }).then((client: Client|null) => {
        if (!client) { return done(null, false); }
        if (client.clientSecret != clientSecret) { return done(null, false); }
        return done(null, client);
    });
}));

passport.use(new BearerStrategy((accessToken, done: Function) => {
    return AccessToken.findOne({
        where: { token: accessToken }
    }).then((token: AccessToken|null) => {
        if (!token) { return done(null, false); }

        if( Math.round((Date.now() - token.createdAt.valueOf()) / 1000) > config.get('security:tokenLife') ) {
            AccessToken.destroy({
                where: { token: token.token }
            }).then((number) => {
                if (!number) return done(new Error('Has no such key'));
            });
            return done(null, false, { message: 'Token expired' });
        }

        User.findOne({
            where: {id: token.userId}
        }).then((user: User|null) => {
            if (!user) { return done(null, false, { message: 'Unknown user' }); }
            done(null, user, { scope: '*' });
        });
    });
}));

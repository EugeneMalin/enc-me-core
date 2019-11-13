import config from './config';
import passport from 'passport';
import crypto from 'crypto';
import oauth2orize from 'oauth2orize';
import AccessToken from './model/accesstoken';
import RefreshToken from './model/refreshtoken';
import User from './model/user';
import logger from './log';

// create OAuth 2.0 server
var server = oauth2orize.createServer();

// Exchange username & password for an access token.
server.exchange(oauth2orize.exchange.password((client, username, password, scope, done) => {
    User.findOne({
        where: { username: username }
    }).then((user) => {
        if (!user) { return done(null, false); }

        if (!user.check(password)) { return done(null, false); }
        RefreshToken.destroy({
            where: { userId: user.id, clientId: client.id }
        });
        AccessToken.destroy({
            where: { userId: user.id, clientId: client.id }
        });

        const tokenValue = crypto.randomBytes(32).toString('hex');
        const refreshTokenValue = crypto.randomBytes(32).toString('hex');

        AccessToken.create({ token: tokenValue, clientId: client.id, userId: user.id }).then(() => {
            done(null, tokenValue, refreshTokenValue, { 'expires_in': config.get('security:tokenLife') });
        });
        RefreshToken.create({ token: refreshTokenValue, clientId: client.id, userId: user.id });
    });
}));

// Exchange refreshToken for an access token.
server.exchange(oauth2orize.exchange.refreshToken((client, refreshToken, scope, done) => {
    RefreshToken.findOne({
        where: { token: refreshToken }
    }).then((token) => {
        if (!token) { return done(null, false); }

        User.findOne({
            where: {id: token.userId}
        }).then((user) => {
            if (!user) { return done(null, false); }

            RefreshToken.destroy({
                where: { userId: user.id, clientId: client.id }
            });
            AccessToken.destroy({
                where: { userId: user.id, clientId: client.id }
            });

            const tokenValue = crypto.randomBytes(32).toString('hex');
            const refreshTokenValue = crypto.randomBytes(32).toString('hex');
            AccessToken.create({ token: tokenValue, clientId: client.clientId, userId: user.id }).then(() => {
                done(null, tokenValue, refreshTokenValue, { 'expires_in': config.get('security:tokenLife') } );
            });
            RefreshToken.create({ token: refreshTokenValue, clientId: client.id, userId: user.id });
        });
    });
}));

// token endpoint
export default [
    passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler()
]
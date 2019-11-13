import bodyParser from 'body-parser';
import passport from 'passport';
import methodOverride from 'method-override';
import express from 'express';

import config from './lib/config';
import logger from './lib/log';
import UserController from './lib/router/user'
import ClientController from './lib/router/client'
import MatchController from './lib/router/match'
import sequelize from './lib/sequelize';
import oauth from './lib/oauth';

import './lib/relations';
import './lib/auth';

const server: express.Application = express();

sequelize.sync();

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

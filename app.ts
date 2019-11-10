import express from 'express';
import config from './lib/config';
import logger from './lib/log';
import './lib/relations';
import bodyParser from 'body-parser';
import MatchController from './lib/router/match'
import sequelize from './lib/sequelize';
const server: express.Application = express();

sequelize.sync();
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));
server.use('/api/match', MatchController);

server.listen(config.get('port'), function() {
    logger.info('Express server listening on port ' + config.get('port'));
});

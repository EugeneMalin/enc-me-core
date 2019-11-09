import express = require('express');
import config from './lib/config';
import logger from './lib/log';
import sequelize from './lib/sequelize';
import Task from './lib/model/task'

const app: express.Application = express();

app.listen(config.get('port'), function() {
    logger.info('Express server listening on port ' + config.get('port'));
});

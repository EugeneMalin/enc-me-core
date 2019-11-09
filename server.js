/**
 * Encounter engine application
 */

var express = require('express');
var config = require('./lib/config');
var log = require('./lib/log')(module);
require('./lib/mongoose');

var app = express();

app.listen(config.get('port'), function() {
    log.info('Express server listening on port ' + config.get('port'));
});

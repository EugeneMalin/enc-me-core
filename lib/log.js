/**
 * Logger creator class
 */

var winston = require('winston');

function createLogger(module) {
    var path = module.filename.split('/').slice(-2).join('/');

    var logger = new winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        defaultMeta: { service: 'user-service' },
        transports : [
            //
            // - Write to all logs with level `info` and below to `combined.log` 
            // - Write all logs error (and below) to `error.log`.
            //
            new winston.transports.File({ filename: 'log/error.log', level: 'error' }),
            new winston.transports.File({ filename: 'log/combined.log' }),
            // - Write debugging logs into the console
            new winston.transports.Console({
                colorize:   true,
                level:      'debug',
                label:      path
            })
        ]
    });
      
    //
    // If we're not in production then log to the `console` with the format:
    // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
    // 
    if (process.env.NODE_ENV !== 'production') {
        logger.add(new winston.transports.Console({
            format: winston.format.simple()
        }));
    }

    return logger;
}

module.exports = createLogger;

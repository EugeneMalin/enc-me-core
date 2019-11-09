/**
 * Logger creator class
 */

import { Logger, createLogger as crtLgr, LoggerOptions, transports, format } from "winston";

const options: LoggerOptions = {
    level: 'info',
    format: format.json(),
    defaultMeta: { service: 'user-service' },
    transports : [
        //
        // - Write to all logs with level `info` and below to `combined.log` 
        // - Write all logs error (and below) to `error.log`.
        //
        new transports.File({ filename: 'log/error.log', level: 'error' }),
        new transports.File({ filename: 'log/combined.log' }),
        // - Write debugging logs into the console
        new transports.Console({
            level: 'debug',
        })
    ]
}
const logger: Logger = crtLgr(options);
    
//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// 
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.simple()
    }));
}

export default logger;

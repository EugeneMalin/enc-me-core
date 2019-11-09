/**
 * Config accessor class
 */

import config from 'nconf';

config.argv()
    .env()
    .file({file: './config.json'});

export default config;

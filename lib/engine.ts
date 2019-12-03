import config from './config';
import { ParsedUrlQuery } from 'querystring';
import { request } from 'http';

export function post(data: ParsedUrlQuery, path: string) {
    return new Promise<string>((resolve) => {
        const req = request({
            hostname: config.get('engine:host'),
            port: config.get('engine:port'),
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
          }, (res) => {
            res.setEncoding('utf8');
            res.on('data', (body) => {
                resolve(body);
            });
        })
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
        });
        req.write(JSON.stringify(data))
        req.end()
    })
}

export function get(data: ParsedUrlQuery, path: string) {
    return new Promise<string>((resolve) => {
        const req = request({
            hostname: config.get('engine:host'),
            port: config.get('engine:port'),
            path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
          }, (res) => {
            res.setEncoding('utf8');
            res.on('data', (body) => {
                resolve(body);
            });
        })
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
        });
        req.write(JSON.stringify(data))
        req.end()
    })
}

'use strict';

const cronometro = require('cronometro'),
    newRedis = require('redis-new'),
    oldRedis = require('redis-old');

let client;
cronometro({
    'New Client': {
        async before() {
            client = newRedis.createClient();
            await client.connect();
        },
        test() {
            return client.ping();
        },
        after() {
            return client.disconnect();
        }
    },
    'New Client - Legacy Mode': {
        async before() {
            client = newRedis.createClient({
                legacyMode: true
            });
            await client.connect();
        },
        test(callback) {
            client.ping(callback);
        },
        after() {
            return client.disconnect();
        }
    },
    'Old Client': {
        before(callback) {
            client = oldRedis.createClient();
            client.once('ready', callback)
        },
        test(callback) {
            client.ping(callback);
        },
        after(callback) {
            client.quit(callback);
        }
    }
});

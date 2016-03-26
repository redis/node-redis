'use strict';

var redis = require('redis');
// The client stashes the password and will reauthenticate on every connect.
redis.createClient({
    password: 'somepass'
});

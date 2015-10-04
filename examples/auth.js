'use strict';

var redis  = require('redis'),
    client = redis.createClient();

// The client stashes the password and will reauthenticate on every connect.
client.auth('somepass');

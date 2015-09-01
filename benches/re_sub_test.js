'use strict';

var client = require('../index').createClient();
var client2 = require('../index').createClient();

client.once('subscribe', function (channel, count) {
  client.unsubscribe('x');
  client.subscribe('x', function () {
    client.quit();
    client2.quit();
  });
  client2.publish('x', 'hi');
});

client.subscribe('x');

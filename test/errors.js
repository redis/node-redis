'use strict';

module.exports = {
    invalidPassword: /^(ERR invalid password|WRONGPASS invalid username-password pair)/,
    subscribeUnsubscribeOnly: /^ERR( Can't execute 'get':)? only \(P\)SUBSCRIBE \/ \(P\)UNSUBSCRIBE/
};

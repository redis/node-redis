'use strict';


var failover = require('../lib/failover');
var assert = require('assert');


describe('failover.prepareOptions', function() {
    it('should convert options to enable redis password', function() {
        var client = {
            connectionOption: {
                host: 'localhost',
                port: 6379
            },
            options: {
                failover: {
                    connections: [
                        { auth_pass: 'new_password' }
                    ]
                }
            }
        };

        failover.prepareOptions(client);

        assert.deepEqual(client._failover, {
            connections: [
                {
                    connectionOption: {
                        host: 'localhost',
                        port: 6379
                    },
                    auth_pass: [ undefined, 'new_password' ]
                }
            ],
            currentConnection: 0,
            currentPass: 0
        });
    });


    it('should convert options to change redis password', function() {
        var client = {
            connectionOption: {
                host: 'localhost',
                port: 6379
            },
            options: {
                auth_pass: 'current_pass',
                failover: {
                    connections: [
                        { auth_pass: 'new_password' }
                    ]
                }
            }
        };

        failover.prepareOptions(client);

        assert.deepEqual(client._failover, {
            connections: [
                {
                    connectionOption: {
                        host: 'localhost',
                        port: 6379
                    },
                    auth_pass: [ 'current_pass', 'new_password' ]
                }
            ],
            currentConnection: 0,
            currentPass: 0
        });
    });


    it('should convert options to switch to another host', function() {
        var client = {
            connectionOption: {
                host: 'host1',
                port: 6379
            },
            options: {
                failover: {
                    connections: [
                        {
                            host: 'host2',
                            port: 6379
                        }
                    ]
                }
            }
        };

        failover.prepareOptions(client);

        assert.deepEqual(client._failover, {
            connections: [
                {
                    connectionOption: {
                        host: 'host1',
                        port: 6379
                    },
                    auth_pass: [ undefined ]
                },
                {
                    connectionOption: {
                        host: 'host2',
                        port: 6379
                    },
                    auth_pass: [ undefined ]
                }
            ],
            currentConnection: 0,
            currentPass: 0
        });
    });


    it('should group auth_pass by connection options', function() {
        var client = {
            connectionOption: {
                host: 'host1',
                port: 6379
            },
            options: {
                auth_pass: 'current_pass1',
                failover: {
                    connections: [
                        {
                            auth_pass: 'new_pass1',
                        },
                        {
                            host: 'host2',
                            port: 6379,
                            auth_pass: 'current_pass2'
                        },
                        {
                            host: 'host2',
                            port: 6379,
                            auth_pass: 'new_pass2'
                        },
                        {
                            port: 6380
                        }
                    ]
                }
            }
        };

        failover.prepareOptions(client);

        assert.deepEqual(client._failover, {
            connections: [
                {
                    connectionOption: {
                        host: 'host1',
                        port: 6379
                    },
                    auth_pass: [ 'current_pass1', 'new_pass1' ]
                },
                {
                    connectionOption: {
                        host: 'host2',
                        port: 6379
                    },
                    auth_pass: [ 'current_pass2', 'new_pass2' ]
                },
                {
                    connectionOption: {
                        port: 6380
                    },
                    auth_pass: [ undefined ]
                }
            ],
            currentConnection: 0,
            currentPass: 0
        });
    });
});

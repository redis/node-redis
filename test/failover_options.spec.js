'use strict';

var failover = require('../lib/failover');
var assert = require('assert');


function CLIENT_2_CONN_NO_AUTH() {
    return {
        connectionOption: {
            host: 'host1',
            port: 6379
        },
        options: {
            failover: {
                connections: [
                    {
                        host: 'host2',
                        port: 6380
                    }
                ]
            }
        },
        retry_delay: 200
    };
}


function CLIENT_2_CONN_WITH_AUTH() {
    return {
        connectionOption: {
            host: 'host1',
            port: 6379
        },
        auth_pass: 'current_pass1', // client constructor copies it here from options
        options: {
            auth_pass: 'current_pass1',
            failover: {
                connections: [
                    {
                        auth_pass: 'new_pass1',
                    },
                    {
                        host: 'host2',
                        port: 6380,
                        auth_pass: 'current_pass2'
                    },
                    {
                        host: 'host2',
                        port: 6380,
                        auth_pass: 'new_pass2'
                    }
                ]
            }
        }
    };
}


describe.only('failover', function() {
    describe('prepareOptions', function() {
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

            assert.deepEqual(client._failover.connections, [
                {
                    connectionOption: {
                        host: 'localhost',
                        port: 6379
                    },
                    auth_pass: [ undefined, 'new_password' ]
                }
            ]);
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

            assert.deepEqual(client._failover.connections, [
                {
                    connectionOption: {
                        host: 'localhost',
                        port: 6379
                    },
                    auth_pass: [ 'current_pass', 'new_password' ]
                }
            ]);
        });


        it('should not use the same password twice', function() {
            var client = {
                connectionOption: {
                    host: 'localhost',
                    port: 6379
                },
                options: {
                    auth_pass: 'current_pass',
                    failover: {
                        connections: [
                            { auth_pass: 'current_pass' }
                        ]
                    }
                }
            };

            failover.prepareOptions(client);

            assert.deepEqual(client._failover.connections, [
                {
                    connectionOption: {
                        host: 'localhost',
                        port: 6379
                    },
                    auth_pass: [ 'current_pass' ]
                }
            ]);
        });


        it('should convert options to switch to another host', function() {
            var client = CLIENT_2_CONN_NO_AUTH();
            failover.prepareOptions(client);

            assert.deepEqual(client._failover.connections, [
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
                        port: 6380
                    },
                    auth_pass: [ undefined ]
                }
            ]);
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
                                port: 6380,
                                auth_pass: 'current_pass2'
                            },
                            {
                                host: 'host2',
                                port: 6380,
                                auth_pass: 'new_pass2'
                            },
                            {
                                port: 6381
                            }
                        ]
                    }
                }
            };

            failover.prepareOptions(client);

            assert.deepEqual(client._failover.connections, [
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
                        port: 6380
                    },
                    auth_pass: [ 'current_pass2', 'new_pass2' ]
                },
                {
                    connectionOption: {
                        port: 6381
                    },
                    auth_pass: [ undefined ]
                }
            ]);
        });
    });


    describe('nextConnection', function() {
        describe('without authentication', function() {
            var client;

            beforeEach(function() {
                client = CLIENT_2_CONN_NO_AUTH();
                failover.prepareOptions(client);
            });

            it('should switch to the next connection', function() {
                failover.nextConnection(client);

                assert.deepEqual(client.connectionOption, { host: 'host2', port: 6380 });
                assert.equal(client._failover.cycle, 0);
                assert.equal(client.retry_delay, 200);
                assert(!client.hasOwnProperty('auth_pass'));
            });

            it('should switch back to the first connection after the second call', function() {
                failover.nextConnection(client);
                failover.nextConnection(client);

                assert.deepEqual(client.connectionOption, { host: 'host1', port: 6379 });
                assert.equal(client._failover.cycle, 1);
                assert.equal(client.retry_delay, 200 * client._failover.retry_backoff);
                assert(!client.hasOwnProperty('auth_pass'));
            });
        });

        describe('with authentication', function() {
            var client;

            beforeEach(function() {
                client = CLIENT_2_CONN_WITH_AUTH();
                failover.prepareOptions(client);
            });

            it('should switch to the next connection using the first password', function() {
                // password is already switched
                client._failover.passwordIndex = 1;
                client.auth_pass = 'new_pass1';

                failover.nextConnection(client);

                assert.deepEqual(client.connectionOption, { host: 'host2', port: 6380 });
                assert.equal(client.auth_pass, 'current_pass2');
                assert.equal(client._failover.cycle, 0);
                assert.equal(client._failover.connectionIndex, 1);
                assert.equal(client._failover.passwordIndex, 0);
            });

            it('should switch back to the first connection after the second call (using the first password)', function() {
                // password is already switched
                client._failover.passwordIndex = 1;
                client.auth_pass = 'new_pass1';

                failover.nextConnection(client);
                failover.nextConnection(client);

                assert.deepEqual(client.connectionOption, { host: 'host1', port: 6379 });
                assert.equal(client.auth_pass, 'current_pass1');
                assert.equal(client._failover.cycle, 1);
                assert.equal(client._failover.connectionIndex, 0);
                assert.equal(client._failover.passwordIndex, 0);
            });
        });
    });

    describe('alternativePasswords', function() {
        it('should return undefined without multiple auth_pass', function() {
            var client = CLIENT_2_CONN_NO_AUTH();
            failover.prepareOptions(client);

            var passwords = failover.alternativePasswords(client);
            assert.equal(passwords, undefined);
        });

        it('should return all passwords of the current connection but current', function() {
            var client = CLIENT_2_CONN_WITH_AUTH();
            failover.prepareOptions(client);

            var passwords = failover.alternativePasswords(client);
            assert.deepEqual(passwords, ['new_pass1']);
        });
    });

    describe('setValidPassword', function() {
        it('should set the index of valid password', function() {
            var client = {
                connectionOption: {
                    host: 'localhost',
                    port: 6379
                },
                auth_pass: 'current_pass', // client constructor copies it here from options
                options: {
                    auth_pass: 'current_pass',
                    failover: {
                        connections: [
                            {
                                auth_pass: 'new_pass1',
                            },
                            {
                                auth_pass: 'new_pass2'
                            }
                        ]
                    }
                }
            };
            failover.prepareOptions(client);
            assert.equal(client._failover.passwordIndex, 0);

            var passwords = failover.alternativePasswords(client);
            assert.deepEqual(passwords, ['new_pass1', 'new_pass2']);

            var valid = failover.setValidPassword(client, 'new_pass1');
            assert.equal(valid, true);
            assert.equal(client._failover.passwordIndex, 1);

            passwords = failover.alternativePasswords(client);
            assert.deepEqual(passwords, ['new_pass2', 'current_pass']);

            valid = failover.setValidPassword(client, 'current_pass');
            assert.equal(valid, true);
            assert.equal(client._failover.passwordIndex, 0);
        });

        it('should return false if passed password was not defined for the current connection', function() {
            var client = {
                connectionOption: {
                    host: 'localhost',
                    port: 6379
                },
                auth_pass: 'current_pass', // client constructor copies it here from options
                options: {
                    auth_pass: 'current_pass',
                    failover: {
                        connections: [
                            {
                                auth_pass: 'new_pass1',
                            },
                            {
                                auth_pass: 'new_pass2'
                            }
                        ]
                    }
                }
            };
            failover.prepareOptions(client);
            assert.equal(client._failover.passwordIndex, 0);

            var valid = failover.setValidPassword(client, 'another_password');
            assert.equal(valid, false);
            assert.equal(client._failover.passwordIndex, 0);
        });
    });
});

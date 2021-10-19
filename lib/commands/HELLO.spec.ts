import { strict as assert } from 'assert';
import { REDIS_VERSION, TestRedisServers, itWithClient, describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './HELLO';

describe('HELLO', () => {
    describeHandleMinimumRedisVersion([6]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['HELLO']
            );
        });

        it('with protover', () => {
            assert.deepEqual(
                transformArguments({
                    protover: 3
                }),
                ['HELLO', '3']
            );
        });

        it('with protover, auth', () => {
            assert.deepEqual(
                transformArguments({
                    protover: 3,
                    auth: {
                        username: 'username',
                        password: 'password'
                    }
                }),
                ['HELLO', '3', 'AUTH', 'username', 'password']
            );
        });

        it('with protover, clientName', () => {
            assert.deepEqual(
                transformArguments({
                    protover: 3,
                    clientName: 'clientName'
                }),
                ['HELLO', '3', 'SETNAME', 'clientName']
            );
        });

        it('with protover, auth, clientName', () => {
            assert.deepEqual(
                transformArguments({
                    protover: 3,
                    auth: {
                        username: 'username',
                        password: 'password'
                    },
                    clientName: 'clientName'
                }),
                ['HELLO', '3', 'AUTH', 'username', 'password', 'SETNAME', 'clientName']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.hello', async client => {
        assert.deepEqual(
            await client.hello(),
            {
                server: 'redis',
                version: REDIS_VERSION.join('.'),
                proto: 2,
                id: await client.clientId(),
                mode: 'standalone',
                role: 'master',
                modules: []
            }
        );
    }, {
        minimumRedisVersion: [6, 2]
    });
});

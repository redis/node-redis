import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './HELLO';

describe('HELLO', () => {
    testUtils.isVersionGreaterThanHook([6]);

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

    testUtils.testWithClient('client.hello', async client => {
        const reply = await client.hello();
        assert.equal(reply.server, 'redis');
        assert.equal(typeof reply.version, 'string');
        assert.equal(reply.proto, 2);
        assert.equal(typeof reply.id, 'number');
        assert.equal(reply.mode, 'standalone');
        assert.equal(reply.role, 'master');
        assert.deepEqual(reply.modules, []);
    }, {
        ...GLOBAL.SERVERS.OPEN,
        minimumDockerVersion: [6, 2]
    });
});

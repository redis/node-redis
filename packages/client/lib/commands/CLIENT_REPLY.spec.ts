import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLIENT_REPLY';

describe('CLIENT REPLY', () => {
    describe('transformArguments', () => {
        it('on', () => {
            assert.deepEqual(
                transformArguments('ON'),
                ['CLIENT', 'REPLY', 'ON']
            );
        });

        it('off', () => {
            assert.deepEqual(
                transformArguments('OFF'),
                ['CLIENT', 'REPLY', 'OFF']
            );
        });

        it('skip', () => {
            assert.deepEqual(
                transformArguments('SKIP'),
                ['CLIENT', 'REPLY', 'SKIP']
            );
        });
    });

    testUtils.testWithClient('client.clientReply', async client => {
        assert.equal(
            await client.clientReply('ON'),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

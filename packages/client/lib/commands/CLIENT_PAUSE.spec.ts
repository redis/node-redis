import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLIENT_PAUSE';

describe('CLIENT PAUSE', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(0),
                ['CLIENT', 'PAUSE', '0']
            );
        });

        it('with mode', () => {
            assert.deepEqual(
                transformArguments(0, 'ALL'),
                ['CLIENT', 'PAUSE', '0', 'ALL']
            );
        });
    });

    testUtils.testWithClient('client.clientPause', async client => {
        assert.equal(
            await client.clientPause(0),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

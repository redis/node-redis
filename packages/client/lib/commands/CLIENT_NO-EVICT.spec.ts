import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLIENT_NO-EVICT';

describe('CLIENT NO-EVICT', () => {
    testUtils.isVersionGreaterThanHook([7]);

    describe('transformArguments', () => {
        it('true', () => {
            assert.deepEqual(
                transformArguments(true),
                ['CLIENT', 'NO-EVICT', 'ON']
            );
        });

        it('false', () => {
            assert.deepEqual(
                transformArguments(false),
                ['CLIENT', 'NO-EVICT', 'OFF']
            );
        });
    });

    testUtils.testWithClient('client.clientNoEvict', async client => {
        assert.equal(
            await client.clientNoEvict(true),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

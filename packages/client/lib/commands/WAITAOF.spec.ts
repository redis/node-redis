import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './WAITAOF';

describe('WAITAOF', () => {
    testUtils.isVersionGreaterThanHook([7, 2]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(1, 0, 0),
                ['WAITAOF', '1', '0', '0']
            );
        });
    });

    testUtils.testWithClient('client.wait', async client => {
        assert.equal(
            await client.waitAOF(1, 0, 0),
            [1, 0]
        );
    }, GLOBAL.SERVERS.OPEN);
});

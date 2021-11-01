import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MEMORY_PURGE';

describe('MEMORY PURGE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['MEMORY', 'PURGE']
        );
    });

    testUtils.testWithClient('client.memoryPurge', async client => {
        assert.equal(
            await client.memoryPurge(),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

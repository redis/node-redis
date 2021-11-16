import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MEMORY_MALLOC-STATS';

describe('MEMORY MALLOC-STATS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['MEMORY', 'MALLOC-STATS']
        );
    });

    testUtils.testWithClient('client.memoryMallocStats', async client => {
        assert.equal(
            typeof (await client.memoryDoctor()),
            'string'
        );
    }, GLOBAL.SERVERS.OPEN);
});

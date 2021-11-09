import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MEMORY_DOCTOR';

describe('MEMORY DOCTOR', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['MEMORY', 'DOCTOR']
        );
    });

    testUtils.testWithClient('client.memoryDoctor', async client => {
        assert.equal(
            typeof (await client.memoryDoctor()),
            'string'
        );
    }, GLOBAL.SERVERS.OPEN);
});

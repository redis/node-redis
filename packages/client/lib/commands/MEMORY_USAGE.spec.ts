import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MEMORY_USAGE';

describe('MEMORY USAGE', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['MEMORY', 'USAGE', 'key']
            );
        });

        it('with SAMPLES', () => {
            assert.deepEqual(
                transformArguments('key', {
                    SAMPLES: 1
                }),
                ['MEMORY', 'USAGE', 'key', 'SAMPLES', '1']
            );
        });
    });

    testUtils.testWithClient('client.memoryUsage', async client => {
        assert.equal(
            await client.memoryUsage('key'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});

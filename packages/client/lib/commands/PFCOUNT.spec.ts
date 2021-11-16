import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './PFCOUNT';

describe('PFCOUNT', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['PFCOUNT', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['PFCOUNT', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.pfCount', async client => {
        assert.equal(
            await client.pfCount('key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});

import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './PFADD';

describe('PFADD', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key', 'element'),
                ['PFADD', 'key', 'element']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('key', ['1', '2']),
                ['PFADD', 'key', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.pfAdd', async client => {
        assert.equal(
            await client.pfAdd('key', '1'),
            true
        );
    }, GLOBAL.SERVERS.OPEN);
});

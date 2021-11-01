import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SUNION';

describe('SUNION', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['SUNION', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['SUNION', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.sUnion', async client => {
        assert.deepEqual(
            await client.sUnion('key'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});

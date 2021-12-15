import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './MADD';

describe('BF MADD', () => {
    describe('transformArguments', () => {
        it('single item', () => {
            assert.deepEqual(
                transformArguments('bloom', 'foo'),
                ['BF.MADD', 'bloom', 'foo']
            );
        });

        it('multiple items', () => {
            assert.deepEqual(
                transformArguments('bloom', 'foo', 'bar'),
                ['BF.MADD', 'bloom', 'foo', 'bar']
            );
        });
    });

    testUtils.testWithClient('client.ts.madd', async client => {
        await client.bf.reserve('bloom', {
            errorRate: 0.01,
            capacity: 100
        });

        assert.deepEqual(await client.bf.mAdd('bloom', 'foo'), [true]);

    }, GLOBAL.SERVERS.OPEN);
});

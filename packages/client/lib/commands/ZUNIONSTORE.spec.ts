import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZUNIONSTORE';

describe('ZUNIONSTORE', () => {
    describe('transformArguments', () => {
        it('key (string)', () => {
            assert.deepEqual(
                transformArguments('destination', 'key'),
                ['ZUNIONSTORE', 'destination', '1', 'key']
            );
        });

        it('keys (array)', () => {
            assert.deepEqual(
                transformArguments('destination', ['1', '2']),
                ['ZUNIONSTORE', 'destination', '2', '1', '2']
            );
        });

        it('with WEIGHTS', () => {
            assert.deepEqual(
                transformArguments('destination', 'key', {
                    WEIGHTS: [1]
                }),
                ['ZUNIONSTORE', 'destination', '1', 'key', 'WEIGHTS', '1']
            );
        });

        it('with AGGREGATE', () => {
            assert.deepEqual(
                transformArguments('destination', 'key', {
                    AGGREGATE: 'SUM'
                }),
                ['ZUNIONSTORE', 'destination', '1', 'key', 'AGGREGATE', 'SUM']
            );
        });

        it('with WEIGHTS, AGGREGATE', () => {
            assert.deepEqual(
                transformArguments('destination', 'key', {
                    WEIGHTS: [1],
                    AGGREGATE: 'SUM'
                }),
                ['ZUNIONSTORE', 'destination', '1', 'key', 'WEIGHTS', '1', 'AGGREGATE', 'SUM']
            );
        });
    });

    testUtils.testWithClient('client.zUnionStore', async client => {
        assert.equal(
            await client.zUnionStore('destination', 'key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});

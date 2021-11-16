import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZINTERSTORE';

describe('ZINTERSTORE', () => {
    describe('transformArguments', () => {
        it('key (string)', () => {
            assert.deepEqual(
                transformArguments('destination', 'key'),
                ['ZINTERSTORE', 'destination', '1', 'key']
            );
        });

        it('keys (array)', () => {
            assert.deepEqual(
                transformArguments('destination', ['1', '2']),
                ['ZINTERSTORE', 'destination', '2', '1', '2']
            );
        });

        it('with WEIGHTS', () => {
            assert.deepEqual(
                transformArguments('destination', 'key', {
                    WEIGHTS: [1]
                }),
                ['ZINTERSTORE', 'destination', '1', 'key', 'WEIGHTS', '1']
            );
        });

        it('with AGGREGATE', () => {
            assert.deepEqual(
                transformArguments('destination', 'key', {
                    AGGREGATE: 'SUM'
                }),
                ['ZINTERSTORE', 'destination', '1', 'key', 'AGGREGATE', 'SUM']
            );
        });

        it('with WEIGHTS, AGGREGATE', () => {
            assert.deepEqual(
                transformArguments('destination', 'key', {
                    WEIGHTS: [1],
                    AGGREGATE: 'SUM'
                }),
                ['ZINTERSTORE', 'destination', '1', 'key', 'WEIGHTS', '1', 'AGGREGATE', 'SUM']
            );
        });
    });

    testUtils.testWithClient('client.zInterStore', async client => {
        assert.equal(
            await client.zInterStore('destination', 'key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});

import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INCRBY';

describe('TOPK INCRBY', () => {
    describe('transformArguments', () => {
        it('single item', () => {
            assert.deepEqual(
                transformArguments('key', {
                    item: 'item',
                    incrementBy: 1
                }),
                ['TOPK.INCRBY', 'key', 'item', '1']
            );
        });

        it('multiple items', () => {
            assert.deepEqual(
                transformArguments('key', [{
                    item: 'a',
                    incrementBy: 1
                }, {
                    item: 'b',
                    incrementBy: 2
                }]),
                ['TOPK.INCRBY', 'key', 'a', '1', 'b', '2']
            );
        });
    });

    testUtils.testWithClient('client.topK.incrby', async client => {
        await client.topK.reserve('key', 5);

        assert.deepEqual(
            await client.topK.incrBy('key', {
                item: 'item',
                incrementBy: 1
            }),
            [null]
        );
    }, GLOBAL.SERVERS.OPEN);
});

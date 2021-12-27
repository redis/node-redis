import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INCRBY';

describe('CMS INCRBY', () => {
    describe('transformArguments', () => {
        it('single item', () => {
            assert.deepEqual(
                transformArguments('key', {
                    item: 'item',
                    incrementBy: 1
                }),
                ['CMS.INCRBY', 'key', 'item', '1']
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
                ['CMS.INCRBY', 'key', 'a', '1', 'b', '2']
            );
        });
    });

    testUtils.testWithClient('client.cms.incrBy', async client => {
        await client.cms.initByDim('key', 1000, 5);
        assert.deepEqual(
            await client.cms.incrBy('key', {
                item: 'item',
                incrementBy: 1
            }),
            [1]
        );
    }, GLOBAL.SERVERS.OPEN);
});

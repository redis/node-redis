import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './LIST_WITHCOUNT';

describe('TOPK LIST WITHCOUNT', () => {
    testUtils.isVersionGreaterThanHook([2, 2, 9]);
    
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['TOPK.LIST', 'key', 'WITHCOUNT']
        );
    });

    testUtils.testWithClient('client.topK.listWithCount', async client => {
        const [,, list] = await Promise.all([
            client.topK.reserve('key', 3),
            client.topK.add('key', 'item'),
            client.topK.listWithCount('key')
        ]);

        assert.deepEqual(
            list,
            [{
                item: 'item',
                count: 1
            }]
        );
    }, GLOBAL.SERVERS.OPEN);
});

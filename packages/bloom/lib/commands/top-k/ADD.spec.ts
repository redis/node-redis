import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './ADD';

describe('TOPK ADD', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'item'),
            ['TOPK.ADD', 'key', 'item']
        );
    });

    testUtils.testWithClient('client.topK.add', async client => {
        await client.topK.reserve('topK', 3);

        assert.deepEqual(
            await client.topK.add('topK', 'item'),
            [null]
        );

    }, GLOBAL.SERVERS.OPEN);
});

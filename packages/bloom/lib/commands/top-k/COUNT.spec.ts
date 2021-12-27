import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './COUNT';

describe('TOPK COUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'item'),
            ['TOPK.COUNT', 'key', 'item']
        );
    });

    testUtils.testWithClient('client.topK.count', async client => {
        await client.topK.reserve('key', 3);

        assert.deepEqual(
            await client.topK.count('key', 'item'),
            [0]
        );
    }, GLOBAL.SERVERS.OPEN);
});

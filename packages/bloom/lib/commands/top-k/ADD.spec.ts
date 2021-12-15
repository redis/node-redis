import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './ADD';

describe('TOPK ADD', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('test', 'foo', 'bar'),
            ['TOPK.ADD', 'test', 'foo', 'bar']
        );
    });

    testUtils.testWithClient('client.topk.add', async client => {
        await client.topk.reserve('topK', 3, [50, 3, 0.9]);

        assert.deepEqual(
            await client.topk.add('topK', 'A', 'B', 'C', 'D'), 
            [null, null, null, 'A']
        );

    }, GLOBAL.SERVERS.OPEN);
});

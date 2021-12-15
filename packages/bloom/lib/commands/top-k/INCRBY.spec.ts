import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INCRBY';

describe('TOPK INCRBY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('test', { foo: 10, bar: 42 }),
            ['TOPK.INCRBY', 'test', 'foo', '10', 'bar', '42']
        );
    });

    testUtils.testWithClient('client.topk.incrby', async client => {
        await client.topk.reserve('A', 5);
        assert.deepEqual(await client.topk.incrBy('A', { foo: 10 }), [null]);
    }, GLOBAL.SERVERS.OPEN);
});

import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './QUERY';

describe('TOPK QUERY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('test', 'foo', 'bar'),
            ['TOPK.QUERY', 'test', 'foo', 'bar']
        );
    });

    testUtils.testWithClient('client.cms.query', async client => {
        await Promise.all([
            client.topk.reserve('A', 3),
            client.topk.incrBy('A', { foo: 10 })
        ]);

        assert.deepEqual(await client.topk.query('A', 'foo', 'bar'), [1, 0]);

    }, GLOBAL.SERVERS.OPEN);
});

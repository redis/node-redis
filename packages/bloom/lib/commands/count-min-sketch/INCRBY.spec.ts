import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INCRBY';

describe('CMS INCRBY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('test', { foo: 10, bar: 42 }),
            ['CMS.INCRBY', 'test', 'foo', '10', 'bar', '42']
        );
    });

    testUtils.testWithClient('client.cms.incrby', async client => {
        await client.cms.initByDim('A', 1000, 5);
        assert.deepEqual(await client.cms.incrBy('A', { foo: 10 }), [10]);
    }, GLOBAL.SERVERS.OPEN);
});

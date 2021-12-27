import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './QUERY';

describe('TOPK QUERY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'item'),
            ['TOPK.QUERY', 'key', 'item']
        );
    });

    testUtils.testWithClient('client.cms.query', async client => {
        await client.topK.reserve('key', 3);

        assert.deepEqual(
            await client.topK.query('key', 'item'),
            [0]
        );
    }, GLOBAL.SERVERS.OPEN);
});

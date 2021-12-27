import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './LIST';

describe('TOPK LIST', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['TOPK.LIST', 'key']
        );
    });

    testUtils.testWithClient('client.topK.list', async client => {
        await client.topK.reserve('key', 3);

        assert.deepEqual(
            await client.topK.list('key'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});

import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INFO';

describe('TOPK INFO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['TOPK.INFO', 'key']
        );
    });

    testUtils.testWithClient('client.topK.info', async client => {
        await client.topK.reserve('key', 3);

        const info = await client.topK.info('key');
        assert.equal(typeof info, 'object');
        assert.equal(info.k, 3);
        assert.equal(typeof info.width, 'number');
        assert.equal(typeof info.depth, 'number');
        assert.equal(typeof info.decay, 'number');
    }, GLOBAL.SERVERS.OPEN);
});

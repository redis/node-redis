import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './ZPOPMAX';

describe('ZPOPMAX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['ZPOPMAX', 'key']
        );
    });

    it('transformReply', () => {
        assert.deepEqual(
            transformReply(['value', '1']),
            {
                value: 'value',
                score: 1
            }
        );
    });

    describe('client.zPopMax', () => {
        testUtils.testWithClient('null', async client => {
            assert.equal(
                await client.zPopMax('key'),
                null
            );
        }, GLOBAL.SERVERS.OPEN);

        testUtils.testWithClient('member', async client => {
            const member = { score: 1, value: 'value' },
                [, zPopMaxReply] = await Promise.all([
                    client.zAdd('key', member),
                    client.zPopMax('key')
                ]);

            assert.deepEqual(zPopMaxReply, member);
        }, GLOBAL.SERVERS.OPEN);
    });
});

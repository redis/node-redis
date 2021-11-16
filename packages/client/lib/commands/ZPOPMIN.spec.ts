import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './ZPOPMIN';

describe('ZPOPMIN', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['ZPOPMIN', 'key']
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

    describe('client.zPopMin', () => {
        testUtils.testWithClient('null', async client => {
            assert.equal(
                await client.zPopMin('key'),
                null
            );
        }, GLOBAL.SERVERS.OPEN);

        testUtils.testWithClient('member', async client => {
            const member = { score: 1, value: 'value' },
                [, zPopMinReply] = await Promise.all([
                    client.zAdd('key', member),
                    client.zPopMin('key')
                ]);

            assert.deepEqual(zPopMinReply, member);
        }, GLOBAL.SERVERS.OPEN);
    });
});

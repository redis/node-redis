import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZREVRANK';

describe('ZREVRANK', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'member'),
            ['ZREVRANK', 'key', 'member']
        );

        assert.deepEqual(
            transformArguments('key', 'member', { WITHSCORE: true }),
            ['ZREVRANK', 'key', 'member', 'WITHSCORE']
        );
    });

    testUtils.testWithClient('client.zRevRank', async client => {
        assert.equal(
            await client.zRevRank('key', 'member'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});

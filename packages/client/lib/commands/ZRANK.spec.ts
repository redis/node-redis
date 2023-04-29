import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZRANK';

describe('ZRANK', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'member'),
            ['ZRANK', 'key', 'member']
        );

        assert.deepEqual(
            transformArguments('key', 'member', { WITHSCORE: true }),
            ['ZRANK', 'key', 'member', 'WITHSCORE']
        );
    });

    testUtils.testWithClient('client.zRank', async client => {
        assert.equal(
            await client.zRank('key', 'member'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});

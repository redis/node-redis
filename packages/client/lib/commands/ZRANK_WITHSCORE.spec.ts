import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './ZRANK_WITHSCORE';

describe('ZRANK WITHSCORE', () => {
    testUtils.isVersionGreaterThanHook([7, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'member'),
            ['ZRANK', 'key', 'member', 'WITHSCORE']
        );
    });

    it('transformReply', () => {
        assert.deepEqual(
            transformReply([]),
            null
        );
        assert.deepEqual(
            transformReply(['test', '1']),
            {
                value: 'test',
                score: 1
            }
        );
    });

    testUtils.testWithClient('client.zRankWithScore empty response', async client => {
        assert.deepEqual(
            await client.zRankWithScore('key', 'member'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('client.zRankWithScore', async client => {
        await Promise.all([
            client.zAdd('zRankWithScoreSet', 1, 'one'),
            client.zAdd('zRankWithScoreSet', 2, 'two')
        ]);        
        assert.deepEqual(
            await client.zRankWithScore('zRankWithScoreSet', 'one'),
            {
                value: 'one',
                score: 0
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});

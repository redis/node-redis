import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './ZREVRANK_WITHSCORE';

describe('ZREVRANK WITHSCORE', () => {
    testUtils.isVersionGreaterThanHook([7, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'member'),
            ['ZREVRANK', 'key', 'member', 'WITHSCORE']
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

    testUtils.testWithClient('client.zRevRankWithScore empty response', async client => {
        assert.deepEqual(
            await client.zRevRankWithScore('key', 'member'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('client.zRevRankWithScore', async client => {
        await Promise.all([
            client.zAdd('zRevRankWithScoreSet', 1, 'one'),
            client.zAdd('zRevRankWithScoreSet', 2, 'two')
        ]);        
        assert.deepEqual(
            await client.zRevRankWithScore('zRevRankWithScoreSet', 'one'),
            {
                value: 'one',
                score: 1
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});

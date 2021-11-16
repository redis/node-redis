import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SUGGET_WITHSCORES';

describe('SUGGET WITHSCORES', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'prefix'),
            ['FT.SUGGET', 'key', 'prefix', 'WITHSCORES']
        );
    });

    describe('client.ft.sugGetWithScores', () => {
        testUtils.testWithClient('null', async client => {
            assert.equal(
                await client.ft.sugGetWithScores('key', 'prefix'),
                null
            );
        }, GLOBAL.SERVERS.OPEN);

        testUtils.testWithClient('with suggestions', async client => {
            await client.ft.sugAdd('key', 'string', 1);

            assert.deepEqual(
                await client.ft.sugGetWithScores('key', 'string'),
                [{
                    suggestion: 'string',
                    score: 2147483648
                }]
            );
        }, GLOBAL.SERVERS.OPEN);
    });
});

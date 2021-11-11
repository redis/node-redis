import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SUGGET_WITHSCORES_WITHPAYLOADS';

describe('SUGGET WITHSCORES WITHPAYLOADS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'prefix'),
            ['FT.SUGGET', 'key', 'prefix', 'WITHSCORES', 'WITHPAYLOADS']
        );
    });

    describe('client.ft.sugGetWithScoresWithPayloads', () => {
        testUtils.testWithClient('null', async client => {
            assert.equal(
                await client.ft.sugGetWithScoresWithPayloads('key', 'prefix'),
                null
            );
        }, GLOBAL.SERVERS.OPEN);

        testUtils.testWithClient('with suggestions', async client => {
            await client.ft.sugAdd('key', 'string', 1, { PAYLOAD: 'payload' });

            assert.deepEqual(
                await client.ft.sugGetWithScoresWithPayloads('key', 'string'),
                [{
                    suggestion: 'string',
                    score: 2147483648,
                    payload: 'payload'
                }]
            );
        }, GLOBAL.SERVERS.OPEN);
    });
});

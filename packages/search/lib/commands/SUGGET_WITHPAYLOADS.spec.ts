import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SUGGET_WITHPAYLOADS';

describe('SUGGET WITHPAYLOADS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'prefix'),
            ['FT.SUGGET', 'key', 'prefix', 'WITHPAYLOADS']
        );
    });

    describe('client.ft.sugGetWithPayloads', () => {
        testUtils.testWithClient('null', async client => {
            assert.equal(
                await client.ft.sugGetWithPayloads('key', 'prefix'),
                null
            );
        }, GLOBAL.SERVERS.OPEN);

        testUtils.testWithClient('with suggestions', async client => {
            await client.ft.sugAdd('key', 'string', 1, { PAYLOAD: 'payload' });

            assert.deepEqual(
                await client.ft.sugGetWithPayloads('key', 'string'),
                [{
                    suggestion: 'string',
                    payload: 'payload'
                }]
            );
        }, GLOBAL.SERVERS.OPEN);
    });
});

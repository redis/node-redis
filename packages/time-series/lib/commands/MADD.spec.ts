import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MADD';

describe('MADD', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments([
                {
                    key: 'key', 
                    timestamp: 0, 
                    value: 0
                }, 
                {
                    key: 'key2', 
                    timestamp: 1, 
                    value: 1
                }]),
            ['TS.MADD', 'key', '0', '0', 'key2', '1', '1']
        );
    });

    // Should we check empty array?

    testUtils.testWithClient('client.ts.madd', async client => {
        await Promise.all([
            client.ts.create('key')
        ]);
        
        assert.deepEqual(
            await client.ts.mAdd([
                {
                    key: 'key', 
                    timestamp: 1, 
                    value: 0
                },
                {
                    key: 'key', 
                    timestamp: 2, 
                    value: 10
                }]),
            [1, 2]
        );
    }, GLOBAL.SERVERS.OPEN);
});

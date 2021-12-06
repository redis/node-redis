import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MADD';

describe('MADD', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments([{
                key: '1',
                timestamp: 0,
                value: 0
            }, {
                key: '2',
                timestamp: 1,
                value: 1
            }]),
            ['TS.MADD', '1', '0', '0', '2', '1', '1']
        );
    });

    // Should we check empty array?

    testUtils.testWithClient('client.ts.mAdd', async client => {
        await client.ts.create('key');

        assert.deepEqual(
            await client.ts.mAdd([{
                key: 'key',
                timestamp: 0,
                value: 0
            }, {
                key: 'key',
                timestamp: 1,
                value: 1
            }]),
            [0, 1]
        );
    }, GLOBAL.SERVERS.OPEN);
});

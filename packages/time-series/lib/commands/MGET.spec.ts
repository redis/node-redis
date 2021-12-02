import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MGET';

describe('MGET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(['name=value', 'age!=']),
            ['TS.MGET', 'FILTER', 'name=value', 'age!=']
        );
    });
    

    testUtils.testWithClient('client.ts.mget', async client => {
        await Promise.all([
            client.ts.create('key', { 
                LABELS: {Test: 'This'} 
            }),
            client.ts.add('key', 10, 15),
        ]);

        assert.deepEqual(
            await client.ts.mGet(['Test=This']),
            [
                {
                    key: 'key',
                    sample: {
                        timestamp: 10,
                        value: 15
                    }
                }
            ]
        );
    }, GLOBAL.SERVERS.OPEN);
});

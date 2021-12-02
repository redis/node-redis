import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './QUERYINDEX';

describe('QUERYINDEX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('age=20'),
            ['TS.QUERYINDEX', 'age=20']
        );
    });
    

    testUtils.testWithClient('client.ts.queryindex', async client => {
        await Promise.all([
            client.ts.create('key', { 
                LABELS: {age: '20'} 
            })
        ]);

        assert.deepEqual(
            await client.ts.queryIndex('age=20'),
            ['key']
        );
    }, GLOBAL.SERVERS.OPEN);
});

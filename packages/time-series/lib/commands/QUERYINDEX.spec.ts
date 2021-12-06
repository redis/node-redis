import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './QUERYINDEX';

describe('QUERYINDEX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('*'),
            ['TS.QUERYINDEX', '*']
        );
    });

    testUtils.testWithClient('client.ts.queryIndex', async client => {
        await Promise.all([
            client.ts.create('key', {
                LABELS: {
                    label: 'value'
                }
            })
        ]);

        assert.deepEqual(
            await client.ts.queryIndex('label=value'),
            ['key']
        );
    }, GLOBAL.SERVERS.OPEN);
});

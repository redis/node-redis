import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './QUERYINDEX';

describe('QUERYINDEX', () => {
    describe('transformArguments', () => {
        it('single filter', () => {
            assert.deepEqual(
                transformArguments('*'),
                ['TS.QUERYINDEX', '*']
            );
        });
        
        it('multiple filters', () => {
            assert.deepEqual(
                transformArguments(['a=1', 'b=2']),
                ['TS.QUERYINDEX', 'a=1', 'b=2']
            );
        });
    });

    testUtils.testWithClient('client.ts.queryIndex', async client => {
        await client.ts.create('key', {
            LABELS: {
                label: 'value'
            }
        });

        assert.deepEqual(
            await client.ts.queryIndex('label=value'),
            ['key']
        );
    }, GLOBAL.SERVERS.OPEN);
});

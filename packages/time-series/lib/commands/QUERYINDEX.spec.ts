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

    it('transformArguments multiple', () => {
        assert.deepEqual(
            transformArguments(['a', 'b', 'c']),
            ['TS.QUERYINDEX', 'a', 'b', 'c']
        );
    });

    testUtils.testWithClient('client.ts.queryIndex', async client => {
        await Promise.all([
            client.ts.create('key', {
                LABELS: {
                    label: 'value'
                }
            }),
            client.ts.create('key2', {
                LABELS: {
                    label1: 'value1',
                    label2: 'value2'
                }
            })
        ]);

        assert.deepEqual(
            await client.ts.queryIndex('label=value'),
            ['key']
        );
        assert.deepEqual(
            await client.ts.queryIndex(['label1=value1', 'label2=value2']),
            ['key2']
        );
    }, GLOBAL.SERVERS.OPEN);
});

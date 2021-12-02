import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MGETWITHLABELS';

describe('MGETWITHLABELS', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments(['name=value']),
                ['TS.MGET', 'WITHLABELS', 'FILTER', 'name=value']
            );
        });

        it('with SELECTED_LABELS', () => {
            assert.deepEqual(
                transformArguments(['name=value'], { SELECTED_LABELS: 'team' }),
                ['TS.MGET', 'SELECTED_LABELS', 'team', 'FILTER', 'name=value']
            );
        });
    });
    

    testUtils.testWithClient('client.ts.mgetwithlabels', async client => {
        await Promise.all([
            client.ts.create('key', {LABELS: {Test: 'This'}}),
            client.ts.add('key', 10, 15),
        ]);

        assert.deepEqual(
            await client.ts.mGetWithLabels(['Test=This']),
            [
                {
                    key: 'key',
                    labels: { Test: 'This'},
                    sample: {
                        timestamp: 10,
                        value: 15
                    }
                }
            ]
        );
    }, GLOBAL.SERVERS.OPEN);
});

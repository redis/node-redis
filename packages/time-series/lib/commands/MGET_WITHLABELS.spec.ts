import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MGET_WITHLABELS';

describe('MGET_WITHLABELS', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('label=value'),
                ['TS.MGET', 'WITHLABELS', 'FILTER', 'label=value']
            );
        });

        it('with SELECTED_LABELS', () => {
            assert.deepEqual(
                transformArguments('label=value', { SELECTED_LABELS: 'label' }),
                ['TS.MGET', 'SELECTED_LABELS', 'label', 'FILTER', 'label=value']
            );
        });
    });

    testUtils.testWithClient('client.ts.mGetWithLabels', async client => {
        await client.ts.add('key', 0, 0, {
            LABELS: { label: 'value' }
        });

        assert.deepEqual(
            await client.ts.mGetWithLabels('label=value'),
            [{
                key: 'key',
                labels: { label: 'value'},
                sample: {
                    timestamp: 0,
                    value: 0
                }
            }]
        );
    }, GLOBAL.SERVERS.OPEN);
});

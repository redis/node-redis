import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MGET';

describe('MGET', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('label=value'),
                ['TS.MGET', 'FILTER', 'label=value']
            );
        });

        it('with LATEST', () => {
            assert.deepEqual(
                transformArguments('label=value', {
                    LATEST: true
                }),
                ['TS.MGET', 'LATEST', 'FILTER', 'label=value']
            );
        });
    });

    testUtils.testWithClient('client.ts.mGet', async client => {
        await client.ts.add('key', 0, 0, {
            LABELS: { label: 'value' }
        });

        assert.deepEqual(
            await client.ts.mGet('label=value'),
            [{
                key: 'key',
                sample: {
                    timestamp: 0,
                    value: 0
                }
            }]
        );
    }, GLOBAL.SERVERS.OPEN);
});

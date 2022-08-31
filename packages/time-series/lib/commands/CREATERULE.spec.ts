import { strict as assert } from 'assert';
import { TimeSeriesAggregationType } from '.';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CREATERULE';

describe('CREATERULE', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('source', 'destination', TimeSeriesAggregationType.AVERAGE, 1),
                ['TS.CREATERULE', 'source', 'destination', 'AGGREGATION', 'AVG', '1']
            );
        });

        it('with alignTimestamp', () => {
            assert.deepEqual(
                transformArguments('source', 'destination', TimeSeriesAggregationType.AVERAGE, 1, 1),
                ['TS.CREATERULE', 'source', 'destination', 'AGGREGATION', 'AVG', '1', '1']
            );
        });
    });

    testUtils.testWithClient('client.ts.createRule', async client => {
        await Promise.all([
            client.ts.create('source'),
            client.ts.create('destination')
        ]);

        assert.equal(
            await client.ts.createRule('source', 'destination', TimeSeriesAggregationType.AVERAGE, 1),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

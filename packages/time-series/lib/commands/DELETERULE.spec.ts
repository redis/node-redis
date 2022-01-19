import { strict as assert } from 'assert';
import { TimeSeriesAggregationType } from '.';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './DELETERULE';

describe('DELETERULE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('source', 'destination'),
            ['TS.DELETERULE', 'source', 'destination']
        );
    });

    testUtils.testWithClient('client.ts.deleteRule', async client => {
        await Promise.all([
            client.ts.create('source'),
            client.ts.create('destination'),
            client.ts.createRule('source', 'destination', TimeSeriesAggregationType.AVERAGE, 1)
        ]);

        assert.equal(
            await client.ts.deleteRule('source', 'destination'),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

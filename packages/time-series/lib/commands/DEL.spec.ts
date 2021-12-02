import { strict as assert } from 'assert';
import { TimeSeriesAggregationType } from '.';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './DEL';

describe('DEL', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1, 10),
            ['TS.DEL', 'key', '1', '10']
        );
    });

    testUtils.testWithClient('client.ts.del', async client => {
        await Promise.all([
            client.ts.create('key'),
            client.ts.add('key', 1, 2),
            client.ts.add('key', 2, 3)
        ]);

        assert.equal(
            await client.ts.del('key', 1, 100),
            2
        );

        assert.equal(
            await client.ts.get('key'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});

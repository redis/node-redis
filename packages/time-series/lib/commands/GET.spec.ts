import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './GET';

describe('GET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['TS.GET', 'key']
        );
    });

    testUtils.testWithClient('client.ts.get', async client => {
        await Promise.all([
            client.ts.create('key'),
            client.ts.add('key', 1, 2)
        ]);

        assert.deepEqual(
            await client.ts.get('key'),
            {
                timestamp: 1,
                value: 2
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});

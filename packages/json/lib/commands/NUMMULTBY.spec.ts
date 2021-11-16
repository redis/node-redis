import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './NUMMULTBY';

describe('NUMMULTBY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', '$', 2),
            ['JSON.NUMMULTBY', 'key', '$', '2']
        );
    });

    testUtils.testWithClient('client.json.numMultBy', async client => {
        await client.json.set('key', '$', 1);

        assert.deepEqual(
            await client.json.numMultBy('key', '$', 2),
            [2]
        );
    }, GLOBAL.SERVERS.OPEN);
});

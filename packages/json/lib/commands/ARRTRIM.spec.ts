import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ARRTRIM';

describe('ARRTRIM', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', '$', 0, 1),
            ['JSON.ARRTRIM', 'key', '$', '0', '1']
        );
    });

    testUtils.testWithClient('client.json.arrTrim', async client => {
        await client.json.set('key', '$', []);

        assert.deepEqual(
            await client.json.arrTrim('key', '$', 0, 1),
            [0]
        );
    }, GLOBAL.SERVERS.OPEN);
});

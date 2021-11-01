import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './TYPE';

describe('TYPE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['TYPE', 'key']
        );
    });

    testUtils.testWithClient('client.type', async client => {
        assert.equal(
            await client.type('key'),
            'none'
        );
    }, GLOBAL.SERVERS.OPEN);
});

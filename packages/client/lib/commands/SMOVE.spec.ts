import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SMOVE';

describe('SMOVE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('source', 'destination', 'member'),
            ['SMOVE', 'source', 'destination', 'member']
        );
    });

    testUtils.testWithClient('client.sMove', async client => {
        assert.equal(
            await client.sMove('source', 'destination', 'member'),
            false
        );
    }, GLOBAL.SERVERS.OPEN);
});

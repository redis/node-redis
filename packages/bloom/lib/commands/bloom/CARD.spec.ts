import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './CARD';

describe('BF CARD', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('bloom'),
            ['BF.CARD', 'bloom']
        );
    });

    testUtils.testWithClient('client.bf.card', async client => {
        assert.equal(
            await client.bf.card('key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});

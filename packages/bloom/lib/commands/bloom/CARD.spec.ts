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
        assert.equal(await client.bf.add('bf1', 'item'), true);
        assert.equal(await client.bf.card('bf1'), 1);
        assert.equal(await client.bf.card("bf_new"), 0);
    }, GLOBAL.SERVERS.OPEN);
});

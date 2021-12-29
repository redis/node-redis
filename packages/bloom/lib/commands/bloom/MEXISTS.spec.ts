import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './MEXISTS';

describe('BF MEXISTS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', ['1', '2']),
            ['BF.MEXISTS', 'key', '1', '2']
        );
    });

    testUtils.testWithClient('client.bf.mExists', async client => {
        assert.deepEqual(
            await client.bf.mExists('key', ['1', '2']),
            [false, false]
        );
    }, GLOBAL.SERVERS.OPEN);
});

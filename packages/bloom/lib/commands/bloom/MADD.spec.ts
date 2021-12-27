import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './MADD';

describe('BF MADD', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', ['1', '2']),
            ['BF.MADD', 'key', '1', '2']
        );
    });

    testUtils.testWithClient('client.ts.mAdd', async client => {
        assert.deepEqual(
            await client.bf.mAdd('key', ['1', '2']),
            [true, true]
        );
    }, GLOBAL.SERVERS.OPEN);
});

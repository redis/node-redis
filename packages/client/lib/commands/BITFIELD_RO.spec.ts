import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './BITFIELD_RO';

describe('BITFIELD RO', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', [{
                encoding: 'i8',
                offset: 0
            }]),
            ['BITFIELD_RO', 'key', 'GET', 'i8', '0']
        );
    });

    testUtils.testWithClient('client.bitFieldRo', async client => {
        assert.deepEqual(
            await client.bitFieldRo('key', [{
                encoding: 'i8',
                offset: 0
            }]),
            [0]
        );
    }, GLOBAL.SERVERS.OPEN);
});

import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './BITFIELD_RO';

describe('BITFIELD_RO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', {
                operation: 'GET',
                type: 'i8',
                offset: 0
            }),
            ['BITFIELD_RO', 'key', 'GET', 'i8', '0']
        );
    });

    testUtils.testWithClient('client.bitFieldReadOnly', async client => {
        assert.deepEqual(
            await client.bitFieldReadOnly('key', {
                operation: 'GET',
                type: 'i8',
                offset: 0
            }),
            [0]
        );
    }, GLOBAL.SERVERS.OPEN);
});

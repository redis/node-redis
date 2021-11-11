import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './XDEL';

describe('XDEL', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key', '0-0'),
                ['XDEL', 'key', '0-0']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('key', ['0-0', '1-0']),
                ['XDEL', 'key', '0-0', '1-0']
            );
        });
    });

    testUtils.testWithClient('client.xDel', async client => {
        assert.equal(
            await client.xDel('key', '0-0'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});

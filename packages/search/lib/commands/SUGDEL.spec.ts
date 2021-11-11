import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SUGDEL';

describe('SUGDEL', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'string'),
            ['FT.SUGDEL', 'key', 'string']
        );
    });

    testUtils.testWithClient('client.ft.sugDel', async client => {
        assert.equal(
            await client.ft.sugDel('key', 'string'),
            false
        );
    }, GLOBAL.SERVERS.OPEN);
});

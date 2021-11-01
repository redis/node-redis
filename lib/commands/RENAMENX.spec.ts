import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './RENAMENX';

describe('RENAMENX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('from', 'to'),
            ['RENAMENX', 'from', 'to']
        );
    });

    testUtils.testWithClient('client.renameNX', async client => {
        await client.set('from', 'value');

        assert.equal(
            await client.renameNX('from', 'to'),
            true
        );
    }, GLOBAL.SERVERS.OPEN);
});

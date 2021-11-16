import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './RENAME';

describe('RENAME', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('from', 'to'),
            ['RENAME', 'from', 'to']
        );
    });

    testUtils.testWithClient('client.rename', async client => {
        await client.set('from', 'value');

        assert.equal(
            await client.rename('from', 'to'),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LASTSAVE';

describe('LASTSAVE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['LASTSAVE']
        );
    });

    testUtils.testWithClient('client.lastSave', async client => {
        assert.ok((await client.lastSave()) instanceof Date);
    }, GLOBAL.SERVERS.OPEN);
});

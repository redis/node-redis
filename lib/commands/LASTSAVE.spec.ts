import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './LASTSAVE';

describe('LASTSAVE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['LASTSAVE']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.lastSave', async client => {
        assert.ok((await client.lastSave()) instanceof Date);
    });
});

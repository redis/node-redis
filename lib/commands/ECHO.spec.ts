import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ECHO';

describe('ECHO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('message'),
            ['ECHO', 'message']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.echo', async client => {
        assert.equal(
            await client.echo('message'),
            'message'
        );
    });
});

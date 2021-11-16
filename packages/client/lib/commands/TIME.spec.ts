import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './TIME';

describe('TIME', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['TIME']
        );
    });

    testUtils.testWithClient('client.time', async client => {
        const reply = await client.time();
        assert.ok(reply instanceof Date);
        assert.ok(typeof reply.microseconds === 'number');
    }, GLOBAL.SERVERS.OPEN);
});

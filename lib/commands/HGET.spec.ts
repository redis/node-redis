import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './HGET';

describe('HGET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'field'),
            ['HGET', 'key', 'field']
        );
    });

    testUtils.testWithClient('client.hGet', async client => {
        assert.equal(
            await client.hGet('key', 'field'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});

import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './HEXISTS';

describe('HEXISTS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'field'),
            ['HEXISTS', 'key', 'field']
        );
    });

    testUtils.testWithClient('client.hExists', async client => {
        assert.equal(
            await client.hExists('key', 'field'),
            false
        );
    }, GLOBAL.SERVERS.OPEN);
});

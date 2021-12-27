import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './COUNT';

describe('CF COUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'item'),
            ['CF.COUNT', 'key', 'item']
        );
    });

    testUtils.testWithClient('client.cf.count', async client => {
        assert.equal(
            await client.cf.count('key', 'item'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});

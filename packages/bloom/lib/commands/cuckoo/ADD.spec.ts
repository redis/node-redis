import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments, transformReply } from './ADD';

describe('CF ADD', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'item'),
            ['CF.ADD', 'key', 'item']
        );
    });

    testUtils.testWithClient('client.cf.add', async client => {
        assert.equal(
            await client.cf.add('key', 'item'),
            true
        );
    }, GLOBAL.SERVERS.OPEN);
});

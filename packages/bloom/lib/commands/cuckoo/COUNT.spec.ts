import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './COUNT';

describe('CF COUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('cuckoo', 'foo'),
            ['CF.COUNT', 'cuckoo', 'foo']
        );
    });

    testUtils.testWithClient('client.cf.del', async client => {
        await client.cf.add('cuckoo', 'foo');
        assert.equal(await client.cf.count('cuckoo', 'foo'), 1);
    }, GLOBAL.SERVERS.OPEN);
});

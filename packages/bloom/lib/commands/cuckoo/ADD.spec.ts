import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments, transformReply } from './ADD';

describe('CF ADD', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('cuckoo', 'foo'),
            ['CF.ADD', 'cuckoo', 'foo']
        );
    });

    testUtils.testWithClient('client.cf.add', async client => {
        assert.ok(await client.cf.add('cuckoo', 'foo'));
    }, GLOBAL.SERVERS.OPEN);
});

import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ACL_DRYRUN';

describe('ACL DRYRUN', () => {
    testUtils.isVersionGreaterThanHook([7]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('default', ['GET', 'key']),
            ['ACL', 'DRYRUN', 'default', 'GET', 'key']
        );
    });

    testUtils.testWithClient('client.aclDryRun', async client => {
        assert.equal(
            await client.aclDryRun('default', ['GET', 'key']),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

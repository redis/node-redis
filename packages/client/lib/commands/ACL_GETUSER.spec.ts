import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ACL_GETUSER';

describe('ACL GETUSER', () => {
    testUtils.isVersionGreaterThanHook([6]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('username'),
            ['ACL', 'GETUSER', 'username']
        );
    });

    testUtils.testWithClient('client.aclGetUser', async client => {
        assert.deepEqual(
            await client.aclGetUser('default'),
            {
                passwords: [],
                commands: '+@all',
                keys: ['*'],
                ...(testUtils.isVersionGreaterThan([6, 2]) ? {
                    flags: ['on', 'allkeys', 'allchannels', 'allcommands', 'nopass'],
                    channels: ['*']
                } : {
                    flags: ['on', 'allkeys', 'allcommands', 'nopass'],
                    channels: undefined
                })
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});

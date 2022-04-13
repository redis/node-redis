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
        const expectedReply: any = {
            passwords: [],
            commands: '+@all',
        };

        if (testUtils.isVersionGreaterThan([7])) {
            expectedReply.flags = ['on', 'nopass'];
            expectedReply.keys = '~*';
            expectedReply.channels = '&*';
            expectedReply.selectors = [];
        } else {
            expectedReply.keys = ['*'];
            expectedReply.selectors = undefined;

            if (testUtils.isVersionGreaterThan([6, 2])) {
                expectedReply.flags = ['on', 'allkeys', 'allchannels', 'allcommands', 'nopass'];
                expectedReply.channels = ['*'];
            } else {
                expectedReply.flags = ['on', 'allkeys', 'allcommands', 'nopass'];
                expectedReply.channels = undefined;
            }
        }

        assert.deepEqual(
            await client.aclGetUser('default'),
            expectedReply
        );
    }, GLOBAL.SERVERS.OPEN);
});

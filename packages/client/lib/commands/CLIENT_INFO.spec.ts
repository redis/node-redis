import { strict as assert } from 'assert';
import { transformArguments, transformReply } from './CLIENT_INFO';
import testUtils, { GLOBAL } from '../test-utils';

describe('CLIENT INFO', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLIENT', 'INFO']
        );
    });

    testUtils.testWithClient('client.clientInfo', async client => {
        const reply = await client.clientInfo();
        assert.equal(typeof reply.id, 'number');
        assert.equal(typeof reply.addr, 'string');
        assert.equal(typeof reply.laddr, 'string');
        assert.equal(typeof reply.fd, 'number');
        assert.equal(typeof reply.name, 'string');
        assert.equal(typeof reply.age, 'number');
        assert.equal(typeof reply.idle, 'number');
        assert.equal(typeof reply.flags, 'string');
        assert.equal(typeof reply.db, 'number');
        assert.equal(typeof reply.sub, 'number');
        assert.equal(typeof reply.psub, 'number');
        assert.equal(typeof reply.multi, 'number');
        assert.equal(typeof reply.qbuf, 'number');
        assert.equal(typeof reply.qbufFree, 'number');
        assert.equal(typeof reply.argvMem, 'number');
        assert.equal(typeof reply.obl, 'number');
        assert.equal(typeof reply.oll, 'number');
        assert.equal(typeof reply.omem, 'number');
        assert.equal(typeof reply.totMem, 'number');
        assert.equal(typeof reply.events, 'string');
        assert.equal(typeof reply.cmd, 'string');
        assert.equal(typeof reply.user, 'string');
        assert.equal(typeof reply.redir, 'number');

        if (testUtils.isVersionGreaterThan([7, 0])) {
            assert.equal(typeof reply.multiMem, 'number');
            assert.equal(typeof reply.resp, 'number');
        }

        if (testUtils.isVersionGreaterThan([7, 0, 3])) {
            assert.equal(typeof reply.ssub, 'number');
        }
    }, GLOBAL.SERVERS.OPEN);
});

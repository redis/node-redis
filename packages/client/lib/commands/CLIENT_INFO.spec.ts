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

    it('transformReply', () => {
        assert.deepEqual(
            transformReply('id=526512 addr=127.0.0.1:36244 laddr=127.0.0.1:6379 fd=8 name= age=11213 idle=0 flags=N db=0 sub=0 psub=0 ssub=0 multi=-1 qbuf=26 qbuf-free=40928 argv-mem=10 multi-mem=0 rbs=1024 rbp=0 obl=0 oll=0 omem=0 tot-mem=61466 events=r cmd=client user=default redir=-1 resp=2\n'),
            {
                id: 526512,
                addr: '127.0.0.1:36244',
                laddr: '127.0.0.1:6379',
                fd: 8,
                name: '',
                age: 11213,
                idle: 0,
                flags: 'N',
                db: 0,
                sub: 0,
                psub: 0,
                ssub: 0,
                multi: -1,
                multiMem: 0,
                qbuf: 26,
                qbufFree: 40928,
                argvMem: 10,
                obl: 0,
                oll: 0,
                omem: 0,
                totMem: 61466,
                events: 'r',
                cmd: 'client',
                user: 'default',
                redir: -1,
                resp: 2
            }
        );
    });

    testUtils.testWithClient(
        'client.clientInfo',
        async (client) => {
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
        },
        GLOBAL.SERVERS.OPEN
    );
});

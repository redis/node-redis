import { strict as assert } from 'assert';
import { transformArguments, transformReply } from './CLIENT_LIST';
import testUtils, { GLOBAL } from '../test-utils';

describe('CLIENT LIST', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(transformArguments(), ['CLIENT', 'LIST']);
        });

        it('with type', () => {
            assert.deepEqual(transformArguments({ type: 'normal' }), ['CLIENT', 'LIST', 'TYPE', 'normal']);
        });

        it('with client id', () => {
            assert.deepEqual(transformArguments({ id: ['1', '2'] }), ['CLIENT', 'LIST', 'ID', '1', '2']);
        });
    });

    it('transformReply', () => {
        assert.deepEqual(
            transformReply(
                'id=526512 addr=127.0.0.1:36244 laddr=127.0.0.1:6379 fd=8 name= age=11213 idle=0 flags=N db=0 sub=0 psub=0 ssub=0 multi=-1 qbuf=26 qbuf-free=40928 argv-mem=10 multi-mem=0 rbs=1024 rbp=0 obl=0 oll=0 omem=0 tot-mem=61466 events=r cmd=client user=default redir=-1 resp=2\nid=526513 addr=127.0.0.1:36244 laddr=127.0.0.1:6379 fd=8 name= age=11213 idle=0 flags=N db=0 sub=0 psub=0 ssub=0 multi=-1 qbuf=26 qbuf-free=40928 argv-mem=10 multi-mem=0 rbs=1024 rbp=0 obl=0 oll=0 omem=0 tot-mem=61466 events=r cmd=client user=default redir=-1 resp=2\n'
            ),
            [
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
                },
                {
                    id: 526513,
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
            ]
        );
    });

    testUtils.testWithClient(
        'client.clientList',
        async (client) => {
            const reply = await client.clientList();
            assert.ok(Array.isArray(reply));

            assert.equal(typeof reply[0].id, 'number');
            assert.equal(typeof reply[0].addr, 'string');
            assert.equal(typeof reply[0].fd, 'number');
            assert.equal(typeof reply[0].name, 'string');
            assert.equal(typeof reply[0].age, 'number');
            assert.equal(typeof reply[0].idle, 'number');
            assert.equal(typeof reply[0].flags, 'string');
            assert.equal(typeof reply[0].db, 'number');
            assert.equal(typeof reply[0].sub, 'number');
            assert.equal(typeof reply[0].psub, 'number');
            assert.equal(typeof reply[0].multi, 'number');
            assert.equal(typeof reply[0].qbuf, 'number');
            assert.equal(typeof reply[0].qbufFree, 'number');
            assert.equal(typeof reply[0].obl, 'number');
            assert.equal(typeof reply[0].oll, 'number');
            assert.equal(typeof reply[0].omem, 'number');
            assert.equal(typeof reply[0].events, 'string');
            assert.equal(typeof reply[0].cmd, 'string');

            if (testUtils.isVersionGreaterThan([6, 0])) {
                assert.equal(typeof reply[0].argvMem, 'number');
                assert.equal(typeof reply[0].totMem, 'number');
                assert.equal(typeof reply[0].user, 'string');
            }

            if (testUtils.isVersionGreaterThan([6, 2])) {
                assert.equal(typeof reply[0].redir, 'number');
                assert.equal(typeof reply[0].laddr, 'string');
            }

            if (testUtils.isVersionGreaterThan([7, 0])) {
                assert.equal(typeof reply[0].multiMem, 'number');
                assert.equal(typeof reply[0].resp, 'number');
            }

            if (testUtils.isVersionGreaterThan([7, 0, 3])) {
                assert.equal(typeof reply[0].ssub, 'number');
            }
        },
        GLOBAL.SERVERS.OPEN
    );
});

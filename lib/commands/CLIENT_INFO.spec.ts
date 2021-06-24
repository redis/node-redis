import { strict as assert } from 'assert';
import { transformArguments, transformReply } from './CLIENT_INFO';

describe('CLIENT INFO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLIENT', 'INFO']
        );
    });

    it('transformReply', () => {
        assert.deepEqual(
            transformReply('id=526512 addr=127.0.0.1:36244 laddr=127.0.0.1:6379 fd=8 name= age=11213 idle=0 flags=N db=0 sub=0 psub=0 multi=-1 qbuf=26 qbuf-free=40928 argv-mem=10 obl=0 oll=0 omem=0 tot-mem=61466 events=r cmd=client user=default redir=-1\n'),
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
                multi: -1,
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
                redir: -1
            }
        );
    });
});

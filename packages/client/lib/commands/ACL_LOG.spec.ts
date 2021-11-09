import { strict as assert } from 'assert';
import testUtils from '../test-utils';
import { transformArguments, transformReply } from './ACL_LOG';

describe('ACL LOG', () => {
    testUtils.isVersionGreaterThanHook([6]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['ACL', 'LOG']
            );
        });

        it('with count', () => {
            assert.deepEqual(
                transformArguments(10),
                ['ACL', 'LOG', '10']
            );
        });
    });

    it('transformReply', () => {
        assert.deepEqual(
            transformReply([[
                'count',
                1,
                'reason',
                'auth',
                'context',
                'toplevel',
                'object',
                'AUTH',
                'username',
                'someuser',
                'age-seconds',
                '4.096',
                'client-info',
                'id=6 addr=127.0.0.1:63026 fd=8 name= age=9 idle=0 flags=N db=0 sub=0 psub=0 multi=-1 qbuf=48 qbuf-free=32720 obl=0 oll=0 omem=0 events=r cmd=auth user=default'
            ]]),
            [{
                count: 1,
                reason: 'auth',
                context: 'toplevel',
                object: 'AUTH',
                username: 'someuser',
                ageSeconds: 4.096,
                clientInfo: 'id=6 addr=127.0.0.1:63026 fd=8 name= age=9 idle=0 flags=N db=0 sub=0 psub=0 multi=-1 qbuf=48 qbuf-free=32720 obl=0 oll=0 omem=0 events=r cmd=auth user=default'
            }]
        );
    });
});

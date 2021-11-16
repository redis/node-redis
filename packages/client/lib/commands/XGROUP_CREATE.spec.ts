import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './XGROUP_CREATE';

describe('XGROUP CREATE', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', 'group', '$'),
                ['XGROUP', 'CREATE', 'key', 'group', '$']
            );
        });

        it('with MKSTREAM', () => {
            assert.deepEqual(
                transformArguments('key', 'group', '$', {
                    MKSTREAM: true
                }),
                ['XGROUP', 'CREATE', 'key', 'group', '$', 'MKSTREAM']
            );
        });
    });

    testUtils.testWithClient('client.xGroupCreate', async client => {
        assert.equal(
            await client.xGroupCreate('key', 'group', '$', {
                MKSTREAM: true
            }),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZREVRANGE';

describe('ZREVRANGE', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('src', 0, 1),
                ['ZREVRANGE', 'src', '0', '1']
            );
        });
    });

    testUtils.testWithClient('client.zRevRange', async client => {
        assert.deepEqual(
            await client.zRevRange('src', 0, 1),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});

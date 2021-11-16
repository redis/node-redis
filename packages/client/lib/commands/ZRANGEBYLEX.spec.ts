import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZRANGEBYLEX';

describe('ZRANGEBYLEX', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('src', '-', '+'),
                ['ZRANGEBYLEX', 'src', '-', '+']
            );
        });

        it('with LIMIT', () => {
            assert.deepEqual(
                transformArguments('src', '-', '+', {
                    LIMIT: {
                        offset: 0,
                        count: 1
                    }
                }),
                ['ZRANGEBYLEX', 'src', '-', '+', 'LIMIT', '0', '1']
            );
        });
    });

    testUtils.testWithClient('client.zRangeByLex', async client => {
        assert.deepEqual(
            await client.zRangeByLex('src', '-', '+'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});

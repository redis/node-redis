import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LCS_IDX_WITHMATCHLEN';

describe('LCS_IDX_WITHMATCHLEN', () => {
    testUtils.isVersionGreaterThanHook([7]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('1', '2'),
            ['LCS', '1', '2', 'IDX', 'WITHMATCHLEN']
        );
    });

    testUtils.testWithClient('client.lcsIdxWithMatchLen', async client => {
        const [, reply] = await Promise.all([
            client.mSet({
                '1': 'abc',
                '2': 'bc'
            }),
            client.lcsIdxWithMatchLen('1', '2')
        ]);

        assert.deepEqual(
            reply,
            {
                matches: [{
                    key1: {
                        start: 1,
                        end: 2
                    },
                    key2: {
                        start: 0,
                        end: 1
                    },
                    length: 2
                }],
                length: 2
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});

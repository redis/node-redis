import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './BITCOUNT';

describe('BITCOUNT', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['BITCOUNT', 'key']
            );
        });

        describe('with range', () => {
            it('simple', () => {
                assert.deepEqual(
                    transformArguments('key', {
                        start: 0,
                        end: 1
                    }),
                    ['BITCOUNT', 'key', '0', '1']
                );
            });

            it('with mode', () => {
                assert.deepEqual(
                    transformArguments('key', {
                        start: 0,
                        end: 1,
                        mode: 'BIT'
                    }),
                    ['BITCOUNT', 'key', '0', '1', 'BIT']
                );
            });
        });
    });

    testUtils.testWithClient('client.bitCount', async client => {
        assert.equal(
            await client.bitCount('key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});

import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './XTRIM';

describe('XTRIM', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', 'MAXLEN', 1),
                ['XTRIM', 'key', 'MAXLEN', '1']
            );
        });

        it('with strategyModifier', () => {
            assert.deepEqual(
                transformArguments('key', 'MAXLEN', 1, {
                    strategyModifier: '='
                }),
                ['XTRIM', 'key', 'MAXLEN', '=', '1']
            );
        });

        it('with LIMIT', () => {
            assert.deepEqual(
                transformArguments('key', 'MAXLEN', 1, {
                    LIMIT: 1
                }),
                ['XTRIM', 'key', 'MAXLEN', '1', 'LIMIT', '1']
            );
        });

        it('with strategyModifier, LIMIT', () => {
            assert.deepEqual(
                transformArguments('key', 'MAXLEN', 1, {
                    strategyModifier: '=',
                    LIMIT: 1
                }),
                ['XTRIM', 'key', 'MAXLEN', '=', '1', 'LIMIT', '1']
            );
        });
    });

    testUtils.testWithClient('client.xTrim', async client => {
        assert.equal(
            await client.xTrim('key', 'MAXLEN', 1),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});

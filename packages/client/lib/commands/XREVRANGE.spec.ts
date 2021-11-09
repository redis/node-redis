import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './XREVRANGE';

describe('XREVRANGE', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', '-', '+'),
                ['XREVRANGE', 'key', '-', '+']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments('key', '-', '+', {
                    COUNT: 1
                }),
                ['XREVRANGE', 'key', '-', '+', 'COUNT', '1']
            );
        });
    });

    testUtils.testWithClient('client.xRevRange', async client => {
        assert.deepEqual(
            await client.xRevRange('key', '+', '-'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});

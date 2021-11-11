import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './PFMERGE';

describe('PFMERGE', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('destination', 'source'),
                ['PFMERGE', 'destination', 'source']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('destination', ['1', '2']),
                ['PFMERGE', 'destination', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.pfMerge', async client => {
        assert.equal(
            await client.pfMerge('destination', 'source'),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

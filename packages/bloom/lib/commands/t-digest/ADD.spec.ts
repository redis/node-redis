import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './ADD';

describe('TDIGEST ADD', () => {
    describe('transformArguments', () => {
        it('basic add', () => {
            assert.deepEqual(
                transformArguments('tDigest', {1: 10, 2: 20}),
                ['TDIGEST.ADD', 'tDigest', '1', '10', '2', '20']
            );
        });
    });

    testUtils.testWithClient('client.tdigest.add', async client => {
        assert.equal(await client.bf.add('tDigest', {1: 10}), 'OK');
    }, GLOBAL.SERVERS.OPEN);
});

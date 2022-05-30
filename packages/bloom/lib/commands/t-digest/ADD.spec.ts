import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './ADD';

describe('TDIGEST.ADD', () => {
    describe('transformArguments', () => {
        it('single item', () => {
            assert.deepEqual(
                transformArguments('key', {
                    value: 1,
                    weight: 2
                }),
                ['TDIGEST.ADD', 'key', '1', '2']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('key', [{
                    value: 1,
                    weight: 2
                }, {
                    value: 3,
                    weight: 4
                }]),
                ['TDIGEST.ADD', 'key', '1', '2', '3', '4']
            );
        });
    });

    testUtils.testWithClient('client.tDigest.add', async client => {
        assert.equal(
            await client.tDigest.add('key', {
                value: 1,
                weight: 2
            }),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

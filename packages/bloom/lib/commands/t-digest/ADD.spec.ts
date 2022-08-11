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

        it('multiple items', () => {
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
        const [ , reply ] = await Promise.all([
            client.tDigest.create('key'),
            client.tDigest.add('key', {
                value: 1,
                weight: 2
            })
        ]);

        assert.equal(reply, 'OK');
    }, GLOBAL.SERVERS.OPEN);
});

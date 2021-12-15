import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './RESERVE';

describe('CF RESERVE', () => {
    describe('transformArguments', () => {
        it('mandatory options', () => {
            assert.deepEqual(
                transformArguments('cuckoo', {
                    capacity: 100
                }),
                ['CF.RESERVE', 'cuckoo', '100']
            );
        });

        it('with EXPANSION', () => {
            assert.deepEqual(
                transformArguments('cuckoo', {
                    capacity: 100,
                    expansion: 1
                }),
                ['CF.RESERVE', 'cuckoo', '100', 'EXPANSION', '1']
            );
        });

        it('with BUCKETSIZE', () => {
            assert.deepEqual(
                transformArguments('cuckoo', {
                    capacity: 100,
                    bucketSize: 200
                }),
                ['CF.RESERVE', 'cuckoo', '100', 'BUCKETSIZE', '200']
            );
        });

        it('with MAXITERATIONS', () => {
            assert.deepEqual(
                transformArguments('cuckoo', {
                    capacity: 100,
                    maxIterations: 5
                }),
                ['CF.RESERVE', 'cuckoo', '100', 'MAXITERATIONS', '5']
            );
        });
    });

    testUtils.testWithClient('client.cf.reserve', async client => {
        assert.equal(
            await client.cf.reserve('cuckoo', { capacity: 100 }),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './RESERVE';

describe('BF RESERVE', () => {
    describe('transformArguments', () => {
        it('mandatory options', () => {
            assert.deepEqual(
                transformArguments('bloom', {
                    errorRate: 0.01,
                    capacity: 100
                }),
                ['BF.RESERVE', 'bloom', '0.01', '100']
            );
        });

        it('with EXPANSION', () => {
            assert.deepEqual(
                transformArguments('bloom', {
                    errorRate: 0.01,
                    capacity: 100,
                    expansion: 1
                }),
                ['BF.RESERVE', 'bloom', '0.01', '100', 'EXPANSION', '1']
            );
        });

        it('with NONSCALING', () => {
            assert.deepEqual(
                transformArguments('bloom', {
                    errorRate: 0.01,
                    capacity: 100,
                    nonScaling: true
                }),
                ['BF.RESERVE', 'bloom', '0.01', '100', 'NONSCALING']
            );
        });

        it('with EXPANSION and NONSCALING', () => {
            assert.deepEqual(
                transformArguments('bloom', {
                    errorRate: 0.01,
                    capacity: 100,
                    expansion: 1,
                    nonScaling: true
                }),
                ['BF.RESERVE', 'bloom', '0.01', '100', 'EXPANSION', '1', 'NONSCALING']
            );
        });
    });

    testUtils.testWithClient('client.bf.reserve', async client => {
        assert.equal(
            await client.bf.reserve('bloom', {
                errorRate: 0.01,
                capacity: 100
            }), 'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

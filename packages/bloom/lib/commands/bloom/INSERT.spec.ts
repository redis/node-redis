import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INSERT';

describe('BF INSERT', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', 'item'),
                ['BF.INSERT', 'key', 'ITEMS', 'item']
            );
        });

        it('with CAPACITY', () => {
            assert.deepEqual(
                transformArguments('key', 'item', { CAPACITY: 100 }),
                ['BF.INSERT', 'key', 'CAPACITY', '100', 'ITEMS', 'item']
            );
        });

        it('with ERROR', () => {
            assert.deepEqual(
                transformArguments('key', 'item', { ERROR: 0.01 }),
                ['BF.INSERT', 'key', 'ERROR', '0.01', 'ITEMS', 'item']
            );
        });

        it('with EXPANSION', () => {
            assert.deepEqual(
                transformArguments('key', 'item', { EXPANSION: 1 }),
                ['BF.INSERT', 'key', 'EXPANSION', '1', 'ITEMS', 'item']
            );
        });

        it('with NOCREATE', () => {
            assert.deepEqual(
                transformArguments('key', 'item', { NOCREATE: true }),
                ['BF.INSERT', 'key', 'NOCREATE', 'ITEMS', 'item']
            );
        });

        it('with NONSCALING', () => {
            assert.deepEqual(
                transformArguments('key', 'item', { NONSCALING: true }),
                ['BF.INSERT', 'key', 'NONSCALING', 'ITEMS', 'item']
            );
        });

        it('with CAPACITY, ERROR, EXPANSION, NOCREATE and NONSCALING', () => {
            assert.deepEqual(
                transformArguments('key', 'item', {
                    CAPACITY: 100,
                    ERROR: 0.01,
                    EXPANSION: 1,
                    NOCREATE: true,
                    NONSCALING: true
                }),
                ['BF.INSERT', 'key', 'CAPACITY', '100', 'ERROR', '0.01', 'EXPANSION', '1', 'NOCREATE', 'NONSCALING', 'ITEMS', 'item']
            );
        });
    });

    testUtils.testWithClient('client.bf.insert', async client => {
        assert.deepEqual(
            await client.bf.insert('key', 'item'),
            [true]
        );
    }, GLOBAL.SERVERS.OPEN);
});

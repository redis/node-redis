import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INSERT';

describe('BF INSERT', () => {
    describe('transformArguments', () => {
        it('no options, multiple items', () => {
            assert.deepEqual(
                transformArguments('bloom', {}, 'bar', 'foo'),
                ['BF.INSERT', 'bloom', 'ITEMS', 'bar', 'foo']
            );
        });

        it('with CAPACITY', () => {
            assert.deepEqual(
                transformArguments('bloom', { capacity: 100 }, 'foo'),
                ['BF.INSERT', 'bloom', 'CAPACITY', '100', 'ITEMS', 'foo']
            );
        });

        it('with ERROR', () => {
            assert.deepEqual(
                transformArguments('bloom', { error: 0.01 }, 'foo'),
                ['BF.INSERT', 'bloom', 'ERROR', '0.01', 'ITEMS', 'foo']
            );
        });

        it('with EXPANSION', () => {
            assert.deepEqual(
                transformArguments('bloom', { expansion: 1 }, 'foo'),
                ['BF.INSERT', 'bloom', 'EXPANSION', '1', 'ITEMS', 'foo']
            );
        });

        it('with NOCREATE', () => {
            assert.deepEqual(
                transformArguments('bloom', { noCreate: true }, 'foo'),
                ['BF.INSERT', 'bloom', 'NOCREATE', 'ITEMS', 'foo']
            );
        });

        it('with NONSCALING', () => {
            assert.deepEqual(
                transformArguments('bloom', { nonScaling: true }, 'foo'),
                ['BF.INSERT', 'bloom', 'NONSCALING', 'ITEMS', 'foo']
            );
        });
    });

    testUtils.testWithClient('client.bf.insert', async client => {
        assert.deepEqual(
            await client.bf.insert('bloom', {}, 'foo', 'bar'), [true, true] 
        );
    }, GLOBAL.SERVERS.OPEN);
});

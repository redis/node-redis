import { strict as assert } from 'assert';
import { pushInsertOptions } from '.';

describe('pushInsertOptions', () => {
    describe('single item', () => {
        it('single item', () => {
            assert.deepEqual(
                pushInsertOptions([], 'item'),
                ['ITEMS', 'item']
            );
        });

        it('multiple items', () => {
            assert.deepEqual(
                pushInsertOptions([], ['1', '2']),
                ['ITEMS', '1', '2']
            );
        });
    });

    it('with CAPACITY', () => {
        assert.deepEqual(
            pushInsertOptions([], 'item', {
                CAPACITY: 100
            }),
            ['CAPACITY', '100', 'ITEMS', 'item']
        );
    });

    it('with NOCREATE', () => {
        assert.deepEqual(
            pushInsertOptions([], 'item', {
                NOCREATE: true
            }),
            ['NOCREATE', 'ITEMS', 'item']
        );
    });

    it('with CAPACITY and NOCREATE', () => {
        assert.deepEqual(
            pushInsertOptions([], 'item', {
                CAPACITY: 100,
                NOCREATE: true
            }),
            ['CAPACITY', '100', 'NOCREATE', 'ITEMS', 'item']
        );
    });
});

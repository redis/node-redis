import { strict as assert } from 'assert';
import { pushArgumentsWithLength, pushSortByArguments } from '.';

describe('pushSortByArguments', () => {
    describe('single', () => {
        it('string', () => {
            assert.deepEqual(
                pushSortByArguments([], 'SORTBY', '@property'),
                ['SORTBY', '1', '@property']
            );
        });

        it('.BY', () => {
            assert.deepEqual(
                pushSortByArguments([], 'SORTBY', { BY: '@property' }),
                ['SORTBY', '1', '@property']
            );
        });

        it('with DIRECTION', () => {
            assert.deepEqual(
                pushSortByArguments([], 'SORTBY', {
                    BY: '@property',
                    DIRECTION: 'ASC'
                }),
                ['SORTBY', '2', '@property', 'ASC']
            );
        });
    });

    it('multiple', () => {
        assert.deepEqual(
            pushSortByArguments([], 'SORTBY', ['@1', '@2']),
            ['SORTBY', '2', '@1', '@2']
        );
    });
});

it('pushArgumentsWithLength', () => {
    assert.deepEqual(
        pushArgumentsWithLength(['a'], args => {
            args.push('b', 'c');
        }),
        ['a', '2', 'b', 'c']
    );
});

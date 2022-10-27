import { strict as assert } from 'assert';
import { pushCompressionArgument, transformDoubleReply, transformDoublesReply } from '.';

describe('pushCompressionArgument', () => {
    it('undefined', () => {
        assert.deepEqual(
            pushCompressionArgument([]),
            []
        );
    });

    it('100', () => {
        assert.deepEqual(
            pushCompressionArgument([], { COMPRESSION: 100 }),
            ['COMPRESSION', '100']
        );
    });
});

describe('transformDoubleReply', () => {
    it('inf', () => {
        assert.equal(
            transformDoubleReply('inf'),
            Infinity
        );
    });

    it('-inf', () => {
        assert.equal(
            transformDoubleReply('-inf'),
            -Infinity
        );
    });

    it('nan', () => {
        assert.equal(
            transformDoubleReply('nan'),
            NaN
        );
    });

    it('0', () => {
        assert.equal(
            transformDoubleReply('0'),
            0
        );
    });
});

it('transformDoublesReply', () => {
    assert.deepEqual(
        transformDoublesReply(['inf', '-inf', 'nan', '0']),
        [Infinity, -Infinity, NaN, 0]
    );
});

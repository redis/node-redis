import { strict as assert } from 'assert';
import { transformArrayReply, transformStringReply } from '.';

describe('index', () => {
    describe('transformArrayReply', () => {
        it('transform array reply', () => {
            assert.deepEqual(
                transformArrayReply(['0', '1', '0']), 
                [false, true, false]
            );
        });
    });

    describe('transformStringReply', () => {
        it('true', () => {
            assert.equal(transformStringReply('1'), true);
        });

        it('false', () => {
            assert.equal(transformStringReply('0'), false);
        });
    });
});

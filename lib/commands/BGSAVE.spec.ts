import { strict as assert } from 'assert';
import { describe } from 'mocha';
import { transformArguments } from './BGSAVE';

describe('BGSAVE', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['BGSAVE']
            );
        });

        it('with SCHEDULE', () => {
            assert.deepEqual(
                transformArguments({
                    SCHEDULE: true
                }),
                ['BGSAVE', 'SCHEDULE']
            );
        });
    });
});

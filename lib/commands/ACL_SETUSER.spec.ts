import { strict as assert } from 'assert';
import { transformArguments } from './ACL_SETUSER';

describe('ACL SETUSER', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('username', 'allkeys'),
                ['ACL', 'SETUSER', 'username', 'allkeys']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('username', ['allkeys', 'allchannels']),
                ['ACL', 'SETUSER', 'username', 'allkeys', 'allchannels']
            );
        });
    });
});

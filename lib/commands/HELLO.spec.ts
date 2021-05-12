import { strict as assert } from 'assert';
import { transformArguments } from './HELLO';

describe('HELLO', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['HELLO']
            );
        });

        it('with protover', () => {
            assert.deepEqual(
                transformArguments(3),
                ['HELLO', '3']
            );
        });

        it('with auth', () => {
            assert.deepEqual(
                transformArguments(3, {
                    username: 'username',
                    password: 'password'
                }),
                ['HELLO', '3', 'AUTH', 'username', 'password']
            );
        });
    });
});

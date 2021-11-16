import { strict as assert } from 'assert';
import { transformArguments } from './AUTH';

describe('AUTH', () => {
    describe('transformArguments', () => {
        it('password only', () => {
            assert.deepEqual(
                transformArguments({
                    password: 'password'
                }),
                ['AUTH', 'password']
            );
        });

        it('username & password', () => {
            assert.deepEqual(
                transformArguments({
                    username: 'username',
                    password: 'password'
                }),
                ['AUTH', 'username', 'password']
            );
        });
    });
});

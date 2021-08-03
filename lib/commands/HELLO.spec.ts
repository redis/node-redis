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
                transformArguments({
                    protover: 3
                }),
                ['HELLO', '3']
            );
        });

        it('with protover, auth', () => {
            assert.deepEqual(
                transformArguments({
                    protover: 3,
                    auth: {
                        username: 'username',
                        password: 'password'
                    }
                }),
                ['HELLO', '3', 'AUTH', 'username', 'password']
            );
        });

        it('with protover, clientName', () => {
            assert.deepEqual(
                transformArguments({
                    protover: 3,
                    clientName: 'clientName'
                }),
                ['HELLO', '3', 'SETNAME', 'clientName']
            );
        });

        it('with protover, auth, clientName', () => {
            assert.deepEqual(
                transformArguments({
                    protover: 3,
                    auth: {
                        username: 'username',
                        password: 'password'
                    },
                    clientName: 'clientName'
                }),
                ['HELLO', '3', 'AUTH', 'username', 'password', 'SETNAME', 'clientName']
            );
        });
    });
});

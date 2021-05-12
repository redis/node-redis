import { strict as assert } from 'assert';
import { transformReply } from './HGETALL.js';

describe('HGETALL', () => {
    describe('transformReply', () => {
        it('empty', () => {
            assert.deepEqual(
                transformReply([]),
                Object.create(null)
            );
        });

        it('with values', () => {
            assert.deepEqual(
                transformReply(['key1', 'value1', 'key2', 'value2']),
                Object.create(null, {
                    key1: {
                        value: 'value1',
                        configurable: true,
                        enumerable: true,
                        writable: true
                    },
                    key2: {
                        value: 'value2',
                        configurable: true,
                        enumerable: true,
                        writable: true
                    }
                })
            );
        });
    });
});

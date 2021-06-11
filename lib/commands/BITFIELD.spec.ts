import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './BITFIELD';

describe('BITFIELD', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['BITFIELD', 'key']
            );
        });

        it('with GET', () => {
            assert.deepEqual(
                transformArguments('key', {
                    GET: {
                        type: 'i8',
                        offset: 0
                    }
                }),
                ['BITFIELD', 'key', 'GET', 'i8', '0']
            );
        });

        it('with SET', () => {
            assert.deepEqual(
                transformArguments('key', {
                    SET: {
                        type: 'i8',
                        offset: 0,
                        value: 0
                    }
                }),
                ['BITFIELD', 'key', 'SET', 'i8', '0', '0']
            );
        });

        it('with INCRBY', () => {
            assert.deepEqual(
                transformArguments('key', {
                    INCRBY: {
                        type: 'i8',
                        offset: 0,
                        increment: 0
                    }
                }),
                ['BITFIELD', 'key', 'INCRBY', 'i8', '0', '0']
            );
        });

        it('with OVERFLOW', () => {
            assert.deepEqual(
                transformArguments('key', {
                    OVERFLOW: 'WRAP'
                }),
                ['BITFIELD', 'key', 'OVERFLOW', 'WRAP']
            );
        });

        it('with GET, SET, INCRBY, OVERFLOW', () => {
            assert.deepEqual(
                transformArguments('key', {
                    GET: {
                        type: 'i8',
                        offset: 0
                    },
                    SET: {
                        type: 'i8',
                        offset: 0,
                        value: 0
                    },
                    INCRBY: {
                        type: 'i8',
                        offset: 0,
                        increment: 0
                    },
                    OVERFLOW: 'WRAP'
                }),
                ['BITFIELD', 'key', 'GET', 'i8', '0', 'SET', 'i8', '0', '0', 'INCRBY', 'i8', '0', '0', 'OVERFLOW', 'WRAP']
            );
        })
    });

    itWithClient(TestRedisServers.OPEN, 'client.bitField', async client => {
        assert.deepEqual(
            await client.bitField('key'),
            []
        );
    });
});

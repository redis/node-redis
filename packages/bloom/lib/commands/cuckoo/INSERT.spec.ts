import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INSERT';

describe('CF INSERT', () => {
    describe('transformArguments', () => {
        it('no options, multiple items', () => {
            assert.deepEqual(
                transformArguments('cuckoo', {}, 'bar', 'foo'),
                ['CF.INSERT', 'cuckoo', 'ITEMS', 'bar', 'foo']
            );
        });

        it('with CAPACITY', () => {
            assert.deepEqual(
                transformArguments('cuckoo', { capacity: 100 }, 'foo'),
                ['CF.INSERT', 'cuckoo', 'CAPACITY', '100', 'ITEMS', 'foo']
            );
        });

        it('with NOCREATE', () => {
            assert.deepEqual(
                transformArguments('cuckoo', { nocreate: true }, 'foo'),
                ['CF.INSERT', 'cuckoo', 'NOCREATE', 'ITEMS', 'foo']
            );
        });

        it('with NOCREATE and CAPACITY', () => {
            assert.deepEqual(
                transformArguments('cuckoo', { capacity: 100, nocreate: true }, 'foo', 'bar'),
                ['CF.INSERT', 'cuckoo', 'CAPACITY', '100', 'NOCREATE', 'ITEMS', 'foo', 'bar']
            );
        });
    });

    testUtils.testWithClient('client.cf.insert', async client => {
        assert.deepEqual(
            await client.cf.insert('cuckoo', {}, 'foo', 'bar'),
            [true, true]
        );
    }, GLOBAL.SERVERS.OPEN);
});

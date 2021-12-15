import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INSERTNX';

describe('CF INSERTNX', () => {
    describe('transformArguments', () => {
        it('no options, multiple items', () => {
            assert.deepEqual(
                transformArguments('cuckoo', {}, 'bar', 'foo'),
                ['CF.INSERTNX', 'cuckoo', 'ITEMS', 'bar', 'foo']
            );
        });

        it('with CAPACITY', () => {
            assert.deepEqual(
                transformArguments('cuckoo', { capacity: 100 }, 'foo'),
                ['CF.INSERTNX', 'cuckoo', 'CAPACITY', '100', 'ITEMS', 'foo']
            );
        });

        it('with NOCREATE', () => {
            assert.deepEqual(
                transformArguments('cuckoo', { nocreate: true }, 'foo'),
                ['CF.INSERTNX', 'cuckoo', 'NOCREATE', 'ITEMS', 'foo']
            );
        });
    });

    // testUtils.testWithClient('client.cf.insertnx', async client => {
    //     assert.deepEqual(
    //         await client.bf.insertNX('cuckoo', {}, 'foo', 'bar'), [1, 1] 
    //     );
    // }, GLOBAL.SERVERS.OPEN);
});

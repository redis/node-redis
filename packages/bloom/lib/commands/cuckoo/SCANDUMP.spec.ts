import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './SCANDUMP';

describe('CF SCANDUMP', () => {
    describe('transformArguments', () => {
        it('basic add', () => {
            assert.deepEqual(
                transformArguments('cuckoo', 0),
                ['CF.SCANDUMP', 'cuckoo', '0']
            );
        });
    });

    // testUtils.testWithClient('client.cf.scandump', async client => {
    //     await client.bf.add('cuckoo', 'foo'); 
    //     assert.equal((await client.bf.scanDump('cuckoo', 0))[0], 1); // checks the iterator
    //     // TODO: should we check the data too?
    //     // assert.equal((await client.bf.scanDump('cuckoo', 0))[1], 'foo');
    // }, GLOBAL.SERVERS.OPEN);
});

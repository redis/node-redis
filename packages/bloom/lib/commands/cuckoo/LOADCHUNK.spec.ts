import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './LOADCHUNK';

describe('CF LOADCHUNK', () => {
    describe('transformArguments', () => {
        it('basic add', () => {
            assert.deepEqual(
                transformArguments('cuckoo', 0, 'foo'),
                ['CF.LOADCHUNK', 'cuckoo', '0', 'foo']
            );
        });
    });

    // testUtils.testWithClient('client.cf.loadchunk', async client => {
    //     await client.bf.add('cuckoo', 'foo');
    //     const res = await client.bf.scanDump('cuckoo', 0)
    //     // TODO
    //     // assert.equal((await client.bf.loadChunk('cuckoo', res[0], res[1])), 'OK');
    // }, GLOBAL.SERVERS.OPEN);
});

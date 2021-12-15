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

    testUtils.testWithClient('client.cf.loadchunk', async client => {
        await client.cf.add('cuckoo', 'foo');
        const res = await client.cf.scanDump('cuckoo', 0)
        // TODO
        // assert.equal((await client.cf.loadChunk('cuckoo', res[0], res[1])), 'OK');
    }, GLOBAL.SERVERS.OPEN);
});

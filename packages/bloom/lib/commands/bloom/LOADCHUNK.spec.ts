import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './LOADCHUNK';

describe('BF LOADCHUNK', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('bloom', 0, 'foo'),
            ['BF.LOADCHUNK', 'bloom', '0', 'foo']
        );
    });

    testUtils.testWithClient('client.bf.loadchunk', async client => {
        await client.bf.add('bloom', 'foo');
        const res = await client.bf.scanDump('bloom', 0)
        // TODO
        // assert.equal((await client.bf.loadChunk('bloom', res[0], res[1])), 'OK');
    }, GLOBAL.SERVERS.OPEN);
});

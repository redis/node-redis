import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './LOADCHUNK';

describe('BF LOADCHUNK', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, ''),
            ['BF.LOADCHUNK', 'key', '0', '']
        );
    });

    testUtils.testWithClient('client.bf.loadChunk', async client => {
        const [, { iterator, chunk }] = await Promise.all([
            client.bf.reserve('source', 0.01, 100),
            client.bf.scanDump(
                client.commandOptions({ returnBuffers: true }),
                'source',
                0
            )
        ]);

        assert.equal(
            await client.bf.loadChunk('destination', iterator, chunk),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

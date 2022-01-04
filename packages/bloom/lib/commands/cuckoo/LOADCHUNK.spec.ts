import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './LOADCHUNK';

describe('CF LOADCHUNK', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('item', 0, ''),
            ['CF.LOADCHUNK', 'item', '0', '']
        );
    });

    testUtils.testWithClient('client.cf.loadChunk', async client => {
        const [,, { iterator, chunk }] = await Promise.all([
            client.cf.reserve('source', 4),
            client.cf.add('source', 'item'),
            client.cf.scanDump(
                client.commandOptions({ returnBuffers: true }),
                'source',
                0
            )
        ]);

        assert.ok(Buffer.isBuffer(chunk));

        assert.equal(
            await client.cf.loadChunk('destination', iterator, chunk),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

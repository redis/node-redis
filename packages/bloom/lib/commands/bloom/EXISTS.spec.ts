import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './EXISTS';

describe('BF EXISTS', () => {
    describe('transformArguments', () => {
        it('basic add', () => {
            assert.deepEqual(
                transformArguments('bloom', 'foo'),
                ['BF.EXISTS', 'bloom', 'foo']
            );
        });
    });

    testUtils.testWithClient('client.bf.exists', async client => {
        await client.bf.add('bloom', 'foo'); 
        assert.ok(await client.bf.exists('bloom', 'foo'));
    }, GLOBAL.SERVERS.OPEN);
});

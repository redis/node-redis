import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments, transformReply } from './ADD';

describe('BF ADD', () => {
    describe('transformArguments', () => {
        it('basic add', () => {
            assert.deepEqual(
                transformArguments('bloom', 'foo'),
                ['BF.ADD', 'bloom', 'foo']
            );
        });
    });

    testUtils.testWithClient('client.bf.add', async client => {
        assert.ok(await client.bf.add('bloom', 'foo'));
    }, GLOBAL.SERVERS.OPEN);
});

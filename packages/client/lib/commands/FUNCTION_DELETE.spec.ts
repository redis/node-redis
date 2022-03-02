import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './FUNCTION_DELETE';

describe('FUNCTION DELETE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('library'),
            ['FUNCTION', 'DELETE', 'library']
        );
    });

    testUtils.testWithClient('client.functionDelete', async client => {
        // TODO
    }, GLOBAL.SERVERS.OPEN);
});

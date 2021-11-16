import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './DBSIZE';

describe('DBSIZE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['DBSIZE']
        );
    });

    testUtils.testWithClient('client.dbSize', async client => {
        assert.equal(
            await client.dbSize(),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});

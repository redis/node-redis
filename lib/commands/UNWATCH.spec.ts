import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './UNWATCH';

describe('UNWATCH', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['UNWATCH']
        );
    });

    testUtils.testWithClient('client.unwatch', async client => {
        assert.equal(
            await client.unwatch(),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

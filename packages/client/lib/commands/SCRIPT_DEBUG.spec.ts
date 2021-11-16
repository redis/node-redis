import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SCRIPT_DEBUG';

describe('SCRIPT DEBUG', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('NO'),
            ['SCRIPT', 'DEBUG', 'NO']
        );
    });

    testUtils.testWithClient('client.scriptDebug', async client => {
        assert.equal(
            await client.scriptDebug('NO'),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

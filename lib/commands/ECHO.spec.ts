import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ECHO';

describe('ECHO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('message'),
            ['ECHO', 'message']
        );
    });

    testUtils.testWithClient('client.echo', async client => {
        assert.equal(
            await client.echo('message'),
            'message'
        );
    }, GLOBAL.SERVERS.OPEN);
});

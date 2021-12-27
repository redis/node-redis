import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './QUERY';

describe('CMS QUERY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'item'),
            ['CMS.QUERY', 'key', 'item']
        );
    });

    testUtils.testWithClient('client.cms.query', async client => {
        await client.cms.initByDim('key', 1000, 5);

        assert.deepEqual(
            await client.cms.query('key', 'item'),
            [0]
        );

    }, GLOBAL.SERVERS.OPEN);
});

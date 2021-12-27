import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INITBYDIM';

describe('CMS INITBYDIM', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1000, 5),
            ['CMS.INITBYDIM', 'key', '1000', '5']
        );
    });

    testUtils.testWithClient('client.cms.initByDim', async client => {
        assert.equal(
            await client.cms.initByDim('key', 1000, 5),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

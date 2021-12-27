import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INFO';

describe('CMS INFO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['CMS.INFO', 'key']
        );
    });

    testUtils.testWithClient('client.cms.info', async client => {
        await client.cms.initByDim('key', 1000, 5);

        assert.deepEqual(
            await client.cms.info('key'),
            {
                width: 1000,
                depth: 5,
                count: 0
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});

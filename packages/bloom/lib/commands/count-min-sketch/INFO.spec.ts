import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INFO';

describe('CMS INFO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('cms'),
            ['CMS.INFO', 'cms']
        );
    });

    testUtils.testWithClient('client.cms.info', async client => {
        await client.cms.initByDim('A', 1000, 5);

        assert.deepEqual(
            await client.cms.info('A'),
            {
                width: 1000,
                depth: 5,
                count: 0
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});

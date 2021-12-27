import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INITBYPROB';

describe('CMS INITBYPROB', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0.001, 0.01),
            ['CMS.INITBYPROB', 'key', '0.001', '0.01']
        );
    });

    testUtils.testWithClient('client.cms.initByProb', async client => {
        assert.equal(
            await client.cms.initByProb('key', 0.001, 0.01),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

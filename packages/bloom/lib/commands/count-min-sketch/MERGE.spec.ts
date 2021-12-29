import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './MERGE';

describe('CMS MERGE', () => {
    describe('transformArguments', () => {
        it('without WEIGHTS', () => {
            assert.deepEqual(
                transformArguments('dest', ['src']),
                ['CMS.MERGE', 'dest', '1', 'src']
            );
        });

        it('with WEIGHTS', () => {
            assert.deepEqual(
                transformArguments('dest', [{
                    name: 'src',
                    weight: 1
                }]),
                ['CMS.MERGE', 'dest', '1', 'src', 'WEIGHTS', '1']
            );
        });
    });

    testUtils.testWithClient('client.cms.merge', async client => {
        await Promise.all([
            client.cms.initByDim('src', 1000, 5),
            client.cms.initByDim('dest', 1000, 5),
        ]);

        assert.equal(
            await client.cms.merge('dest', ['src']),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

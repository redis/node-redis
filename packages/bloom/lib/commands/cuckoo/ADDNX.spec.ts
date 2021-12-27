import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './ADDNX';

describe('CF ADDNX', () => {
    describe('transformArguments', () => {
        it('basic add', () => {
            assert.deepEqual(
                transformArguments('key', 'item'),
                ['CF.ADDNX', 'key', 'item']
            );
        });
    });

    testUtils.testWithClient('client.cf.add', async client => {
        assert.equal(
            await client.cf.addNX('key', 'item'),
            true
        );
    }, GLOBAL.SERVERS.OPEN);
});

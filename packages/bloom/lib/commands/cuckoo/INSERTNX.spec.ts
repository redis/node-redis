import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INSERTNX';

describe('CF INSERTNX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'item', {
                CAPACITY: 100,
                NOCREATE: true
             }),
            ['CF.INSERTNX', 'key', 'CAPACITY', '100', 'NOCREATE', 'ITEMS', 'item']
        );
    });

    testUtils.testWithClient('client.cf.insertnx', async client => {
        assert.deepEqual(
            await client.cf.insertNX('key', 'item'),
            [true]
        );
    }, GLOBAL.SERVERS.OPEN);
});

import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INSERT';

describe('CF INSERT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'item', {
                CAPACITY: 100,
                NOCREATE: true
             }),
            ['CF.INSERT', 'key', 'CAPACITY', '100', 'NOCREATE', 'ITEMS', 'item']
        );
    });

    testUtils.testWithClient('client.cf.insert', async client => {
        assert.deepEqual(
            await client.cf.insert('key', 'item'),
            [true]
        );
    }, GLOBAL.SERVERS.OPEN);
});

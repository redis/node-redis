import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './DICTDUMP';

describe('DICTDUMP', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('dictionary'),
            ['FT.DICTDUMP', 'dictionary']
        );
    });

    testUtils.testWithClient('client.ft.dictDump', async client => {
        await client.ft.dictAdd('dictionary', 'string')

        assert.deepEqual(
            await client.ft.dictDump('dictionary'),
            ['string']
        );
    }, GLOBAL.SERVERS.OPEN);
});

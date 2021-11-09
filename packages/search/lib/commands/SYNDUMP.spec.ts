import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SYNDUMP';

describe('SYNDUMP', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('index'),
            ['FT.SYNDUMP', 'index']
        );
    });

    testUtils.testWithClient('client.ft.synDump', async client => {
        await client.ft.create('index', {}, {
            ON: 'HASH' // TODO: shouldn't be mandatory
        });

        assert.deepEqual(
            await client.ft.synDump('index'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});

import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import INFO from './INFO';
import { SCHEMA_FIELD_TYPE } from './CREATE';

describe('INFO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            INFO.transformArguments('index'),
            ['FT.INFO', 'index']
        );
    });

    testUtils.testWithClient('client.ft.info', async client => {
        await client.ft.create('index', {
            field: SCHEMA_FIELD_TYPE.TEXT
        });
        const reply = await client.ft.info('index');
        assert.deepEqual(reply.indexName, 'index');
        assert.deepEqual(reply.indexOptions, []);
        assert.deepEqual(reply.numDocs, '0');
    }, GLOBAL.SERVERS.OPEN);
});

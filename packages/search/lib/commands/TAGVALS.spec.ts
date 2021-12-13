import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { SchemaFieldTypes } from '.';
import { transformArguments } from './TAGVALS';

describe('TAGVALS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('index', '@field'),
            ['FT.TAGVALS', 'index', '@field']
        );
    });

    testUtils.testWithClient('client.ft.tagVals', async client => {
        await client.ft.create('index', {
            field: SchemaFieldTypes.TAG
        });

        assert.deepEqual(
            await client.ft.tagVals('index', 'field'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});

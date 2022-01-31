import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SYNDUMP';
import { SchemaFieldTypes } from '.';

describe('SYNDUMP', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('index'),
            ['FT.SYNDUMP', 'index']
        );
    });

    testUtils.testWithClient('client.ft.synDump', async client => {
        await client.ft.create('index', {
            field: SchemaFieldTypes.TEXT
        });

        assert.deepEqual(
            await client.ft.synDump('index'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});

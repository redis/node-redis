import { strict as assert } from 'assert';
import { SchemaFieldTypes } from '.';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SEARCH_NOCONTENT';

describe('SEARCH_NOCONTENT', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('index', 'query'),
                ['FT.SEARCH', 'index', 'query', 'NOCONTENT']
            );
        });
    });

    describe('client.ft.searchNoContent', () => {
        testUtils.testWithClient('returns total and keys', async client => {
            await Promise.all([
                client.ft.create('index', {
                    field: SchemaFieldTypes.NUMERIC
                }),
                client.hSet('1', 'field', 'field1'),
                client.hSet('2', 'field', 'field2'),
                client.hSet('3', 'field', 'field3')
            ]);

            assert.deepEqual(
                await client.ft.searchNoContent('index', '*'),
                {
                    total: 3,
                    documents: ['1','2','3']
                }
            );
        }, GLOBAL.SERVERS.OPEN);
    });
});

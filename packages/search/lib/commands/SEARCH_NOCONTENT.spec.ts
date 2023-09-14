import { strict as assert } from 'assert';
import { SchemaFieldTypes } from '.';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './SEARCH_NOCONTENT';

describe('SEARCH_NOCONTENT', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('index', 'query'),
                ['FT.SEARCH', 'index', 'query', 'NOCONTENT']
            );
        });
    });

    describe('transformReply', () => {
        it('returns total and keys', () => {
            assert.deepEqual(transformReply([3, '1', '2', '3']), {
                total: 3,
                documents: ['1', '2', '3']
            })
        });
    });

    describe('client.ft.searchNoContent', () => {
        testUtils.testWithClient('returns total and keys', async client => {
            await Promise.all([
                client.ft.create('index', {
                    field: SchemaFieldTypes.TEXT
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

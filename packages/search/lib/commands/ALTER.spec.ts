import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ALTER';
import { SchemaFieldTypes } from '.';

describe('ALTER', () => {
    describe('transformArguments', () => {
        it('with NOINDEX', () => {
            assert.deepEqual(
                transformArguments('index', {
                    field: {
                        type: SchemaFieldTypes.TEXT,
                        NOINDEX: true,
                        SORTABLE: 'UNF',
                        AS: 'text'
                    }
                }),
                ['FT.ALTER', 'index', 'SCHEMA', 'ADD', 'field', 'AS', 'text', 'TEXT', 'SORTABLE', 'UNF', 'NOINDEX']
            );
        });
    });

    testUtils.testWithClient('client.ft.create', async client => {
        await Promise.all([
            client.ft.create('index', {
                title: SchemaFieldTypes.TEXT
            }),
        ]);

        assert.equal(
            await client.ft.alter('index', {
                body: SchemaFieldTypes.TEXT
            }),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

import { strict as assert } from 'assert';
import { SchemaFieldTypes } from '.';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CURSOR_READ';

describe('CURSOR READ', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('index', 0),
                ['FT.CURSOR', 'READ', 'index', '0']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments('index', 0, { COUNT: 1 }),
                ['FT.CURSOR', 'READ', 'index', '0', 'COUNT', '1']
            );
        });
    });

    testUtils.testWithClient('client.ft.cursorRead', async client => {
        const [, , { cursor }] = await Promise.all([
            client.ft.create('idx', {
                field: {
                    type: SchemaFieldTypes.TEXT
                }
            }),
            client.hSet('key', 'field', 'value'),
            client.ft.aggregateWithCursor('idx', '*', {
                COUNT: 1
            })
        ]);

        assert.deepEqual(
            await client.ft.cursorRead('idx', cursor),
            {
                total: 0,
                results: [],
                cursor: 0
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});

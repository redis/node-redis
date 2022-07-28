import { strict as assert } from 'assert';
import { SchemaFieldTypes } from '.';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CURSOR_DEL';

describe('CURSOR DEL', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('index', 0),
            ['FT.CURSOR', 'DEL', 'index', '0']
        );
    });

    testUtils.testWithClient('client.ft.cursorDel', async client => {
        const [ ,, { cursor } ] = await Promise.all([
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


        assert.equal(
            await client.ft.cursorDel('idx', cursor),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

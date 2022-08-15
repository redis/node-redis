import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './AGGREGATE_WITHCURSOR';
import { SchemaFieldTypes } from '.';

describe('AGGREGATE WITHCURSOR', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('index', '*'),
                ['FT.AGGREGATE', 'index', '*', 'WITHCURSOR']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments('index', '*', { COUNT: 1 }),
                ['FT.AGGREGATE', 'index', '*', 'WITHCURSOR', 'COUNT', '1']
            );
        });
    });

    testUtils.testWithClient('client.ft.aggregateWithCursor', async client => {
        await client.ft.create('index', {
            field: SchemaFieldTypes.NUMERIC
        });

        assert.deepEqual(
            await client.ft.aggregateWithCursor('index', '*'),
            {
                total: 0,
                results: [],
                cursor: 0
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});

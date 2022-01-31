import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { SchemaFieldTypes } from '.';
import { transformArguments } from './DROPINDEX';

describe('DROPINDEX', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('index'),
                ['FT.DROPINDEX', 'index']
            );
        });

        it('with DD', () => {
            assert.deepEqual(
                transformArguments('index', { DD: true }),
                ['FT.DROPINDEX', 'index', 'DD']
            );
        });
    });

    testUtils.testWithClient('client.ft.dropIndex', async client => {
        await client.ft.create('index', {
            field: SchemaFieldTypes.TEXT
        });

        assert.equal(
            await client.ft.dropIndex('index'),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

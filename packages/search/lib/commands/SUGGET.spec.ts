import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SUGGET';

describe('SUGGET', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('key', 'prefix'),
                ['FT.SUGGET', 'key', 'prefix']
            );
        });

        it('with FUZZY', () => {
            assert.deepEqual(
                transformArguments('key', 'prefix', { FUZZY: true }),
                ['FT.SUGGET', 'key', 'prefix', 'FUZZY']
            );
        });

        it('with MAX', () => {
            assert.deepEqual(
                transformArguments('key', 'prefix', { MAX: 10 }),
                ['FT.SUGGET', 'key', 'prefix', 'MAX', '10']
            );
        });
    });

    describe('client.ft.sugGet', () => {
        testUtils.testWithClient('null', async client => {
            assert.equal(
                await client.ft.sugGet('key', 'prefix'),
                null
            );
        }, GLOBAL.SERVERS.OPEN);

        testUtils.testWithClient('with suggestions', async client => {
            await client.ft.sugAdd('key', 'string', 1);

            assert.deepEqual(
                await client.ft.sugGet('key', 'string'),
                ['string']
            );
        }, GLOBAL.SERVERS.OPEN);
    });
});

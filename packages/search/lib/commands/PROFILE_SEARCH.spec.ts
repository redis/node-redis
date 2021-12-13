import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { SchemaFieldTypes } from '.';
import { transformArguments } from './PROFILE_SEARCH';

describe('PROFILE SEARCH', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('index', 'query'),
                ['FT.PROFILE', 'index', 'SEARCH', 'QUERY', 'query']
            );
        });

        it('with options', () => {
            assert.deepEqual(
                transformArguments('index', 'query', { 
                    LIMITED: true,
                    VERBATIM: true,
                    INKEYS: 'key'
                }),
                ['FT.PROFILE', 'index', 'SEARCH', 'LIMITED', 'QUERY', 'query',
                 'VERBATIM', 'INKEYS', '1', 'key']
            );
        });
    });

    testUtils.testWithClient('client.ft.search', async client => {
        await Promise.all([
            client.ft.create('index', {
                field: SchemaFieldTypes.NUMERIC
            }),
            client.hSet('1', 'field', '1')
        ]);
        
        const res = await client.ft.profileSearch('index', '*');
        assert.ok(typeof res.profile.iteratorsProfile.counter === 'number');
        assert.ok(typeof res.profile.parsingTime === 'string');
        assert.ok(res.results.total == 1);
    }, GLOBAL.SERVERS.OPEN);
});

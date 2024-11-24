import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PROFILE_SEARCH from './PROFILE_SEARCH';
import { SCHEMA_FIELD_TYPE } from './CREATE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';


describe('PROFILE SEARCH', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                parseArgs(PROFILE_SEARCH, 'index', 'query'),
                ['FT.PROFILE', 'index', 'SEARCH', 'QUERY', 'query']
            );
        });

        it('with options', () => {
            assert.deepEqual(
                parseArgs(PROFILE_SEARCH, 'index', 'query', { 
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
                field: SCHEMA_FIELD_TYPE.NUMERIC
            }),
            client.hSet('1', 'field', '1')
        ]);
        
        const res = await client.ft.profileSearch('index', '*');
        assert.strictEqual('None', res.profile.warning);
        assert.ok(typeof res.profile.iteratorsProfile.counter === 'number');
        assert.ok(typeof res.profile.parsingTime === 'string');
        assert.ok(res.results.total == 1);
    }, GLOBAL.SERVERS.OPEN);
});

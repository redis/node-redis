import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { FT_AGGREGATE_STEPS } from './AGGREGATE';
import PROFILE_AGGREGATE from './PROFILE_AGGREGATE';
import { SCHEMA_FIELD_TYPE } from './CREATE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('PROFILE AGGREGATE', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                parseArgs(PROFILE_AGGREGATE, 'index', 'query'),
                ['FT.PROFILE', 'index', 'AGGREGATE', 'QUERY', 'query']
            );
        });

        it('with options', () => {
            assert.deepEqual(
                parseArgs(PROFILE_AGGREGATE, 'index', 'query', { 
                    LIMITED: true,
                    VERBATIM: true,
                    STEPS: [{
                        type: FT_AGGREGATE_STEPS.SORTBY,
                        BY: '@by'
                    }]
                }),
                ['FT.PROFILE', 'index', 'AGGREGATE', 'LIMITED', 'QUERY', 'query',
                 'VERBATIM', 'SORTBY', '1', '@by']
            );
        });
    });

    testUtils.testWithClient('client.ft.search', async client => {
        await Promise.all([
            client.ft.create('index', {
                field: SCHEMA_FIELD_TYPE.NUMERIC
            }),
            client.hSet('1', 'field', '1'),
            client.hSet('2', 'field', '2')
        ]);
        
        const res = await client.ft.profileAggregate('index', '*');
        assert.deepEqual('None', res.profile.warning);
        assert.ok(typeof res.profile.iteratorsProfile.counter === 'number');
        assert.ok(typeof res.profile.parsingTime === 'string');
        assert.ok(res.results.total == 1);
    }, GLOBAL.SERVERS.OPEN);
});

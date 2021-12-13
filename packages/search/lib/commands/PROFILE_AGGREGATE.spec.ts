import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { SchemaFieldTypes } from '.';
import { transformArguments } from './PROFILE_AGGREGATE';
import { AggregateSteps } from './AGGREGATE';

describe('PROFILE AGGREGATE', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('index', 'query'),
                ['FT.PROFILE', 'index', 'AGGREGATE', 'QUERY', 'query']
            );
        });

        it('with options', () => {
            assert.deepEqual(
                transformArguments('index', 'query', { 
                    LIMITED: true,
                    VERBATIM: true,
                    STEPS: [{
                        type: AggregateSteps.SORTBY,
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
                field: SchemaFieldTypes.NUMERIC
            }),
            client.hSet('1', 'field', '1'),
            client.hSet('2', 'field', '2')
        ]);
        
        const res = await client.ft.profileAggregate('index', '*');
        assert.ok(typeof res.profile.iteratorsProfile.counter === 'number');
        assert.ok(typeof res.profile.parsingTime === 'string');
        assert.ok(res.results.total == 1);
    }, GLOBAL.SERVERS.OPEN);
});

import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PROFILE_SEARCH from './PROFILE_SEARCH';
import { SCHEMA_FIELD_TYPE } from './CREATE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import { DEFAULT_DIALECT } from '../dialect/default';

describe('PROFILE SEARCH', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                parseArgs(PROFILE_SEARCH, 'index', 'query'),
                ['FT.PROFILE', 'index', 'SEARCH', 'QUERY', 'query', 'DIALECT', DEFAULT_DIALECT]
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
                 'VERBATIM', 'INKEYS', '1', 'key', 'DIALECT', DEFAULT_DIALECT]
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

    const normalizeObject = obj => JSON.parse(JSON.stringify(obj));

    const res = await client.ft.profileSearch('index', '*');

    const normalizedRes = normalizeObject(res);
    assert.equal(normalizedRes.results.total, 1);

    assert.ok(normalizedRes.profile[0] === 'Shards');
    assert.ok(Array.isArray(normalizedRes.profile[1]));
    assert.ok(normalizedRes.profile[2] === 'Coordinator');
    assert.ok(Array.isArray(normalizedRes.profile[3]));

    const shardProfile = normalizedRes.profile[1][0];
    assert.ok(shardProfile.includes('Total profile time'));
    assert.ok(shardProfile.includes('Parsing time'));
    assert.ok(shardProfile.includes('Pipeline creation time'));
    assert.ok(shardProfile.includes('Warning'));
    assert.ok(shardProfile.includes('Iterators profile'));;

  }, GLOBAL.SERVERS.OPEN);
});

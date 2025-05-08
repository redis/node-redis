import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { FT_AGGREGATE_STEPS } from './AGGREGATE';
import PROFILE_AGGREGATE from './PROFILE_AGGREGATE';
import { SCHEMA_FIELD_TYPE } from './CREATE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import { DEFAULT_DIALECT } from '../dialect/default';

describe('PROFILE AGGREGATE', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(PROFILE_AGGREGATE, 'index', 'query'),
        ['FT.PROFILE', 'index', 'AGGREGATE', 'QUERY', 'query', 'DIALECT', DEFAULT_DIALECT]
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
          'VERBATIM', 'SORTBY', '1', '@by', 'DIALECT', DEFAULT_DIALECT]
      );
    });
  });

  testUtils.testWithClientIfVersionWithinRange([[8], 'LATEST'], 'client.ft.search', async client => {
    await Promise.all([
      client.ft.create('index', {
        field: SCHEMA_FIELD_TYPE.NUMERIC
      }),
      client.hSet('1', 'field', '1'),
      client.hSet('2', 'field', '2')
    ]);


    const normalizeObject = obj => JSON.parse(JSON.stringify(obj));
    const res = await client.ft.profileAggregate('index', '*');

    const normalizedRes = normalizeObject(res);
    // TODO uncomment after https://redis.io/docs/latest/commands/ft.aggregate/#return
    // starts returning valid values
    // assert.equal(normalizedRes.results.total, 2);

    assert.ok(normalizedRes.profile[0] === 'Shards');
    assert.ok(Array.isArray(normalizedRes.profile[1]));
    assert.ok(normalizedRes.profile[2] === 'Coordinator');
    assert.ok(Array.isArray(normalizedRes.profile[3]));

    const shardProfile = normalizedRes.profile[1][0];
    assert.ok(shardProfile.includes('Total profile time'));
    assert.ok(shardProfile.includes('Parsing time'));
    assert.ok(shardProfile.includes('Pipeline creation time'));
    assert.ok(shardProfile.includes('Warning'));
    assert.ok(shardProfile.includes('Iterators profile'));

  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[7, 2, 0], [7, 4, 0]], 'client.ft.search', async client => {
    await Promise.all([
      client.ft.create('index', {
        field: SCHEMA_FIELD_TYPE.NUMERIC
      }),
      client.hSet('1', 'field', '1'),
      client.hSet('2', 'field', '2')
    ]);

    const normalizeObject = obj => JSON.parse(JSON.stringify(obj));
    const res = await client.ft.profileAggregate('index', '*');
    const normalizedRes = normalizeObject(res);

    // TODO uncomment after https://redis.io/docs/latest/commands/ft.aggregate/#return
    // starts returning valid values
    // assert.equal(normalizedRes.results.total, 2);

    assert.ok(Array.isArray(normalizedRes.profile));
    assert.equal(normalizedRes.profile[0][0], 'Total profile time');
    assert.equal(normalizedRes.profile[1][0], 'Parsing time');
    assert.equal(normalizedRes.profile[2][0], 'Pipeline creation time');
    assert.equal(normalizedRes.profile[3][0], 'Warning');
    assert.equal(normalizedRes.profile[4][0], 'Iterators profile');
    assert.equal(normalizedRes.profile[5][0], 'Result processors profile');

    const iteratorsProfile = normalizedRes.profile[4][1];
    assert.equal(iteratorsProfile[0], 'Type');
    assert.equal(iteratorsProfile[1], 'WILDCARD');
    assert.equal(iteratorsProfile[2], 'Time');
    assert.equal(iteratorsProfile[4], 'Counter');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8], 'LATEST'], '[RESP3] client.ft.search', async client => {
    await Promise.all([
      client.ft.create('index', {
        field: SCHEMA_FIELD_TYPE.NUMERIC
      }),
      client.hSet('1', 'field', '1'),
      client.hSet('2', 'field', '2')
    ]);


    const normalizeObject = obj => JSON.parse(JSON.stringify(obj));
    const res = await client.ft.profileAggregate('index', '*');

    // TODO uncomment after https://redis.io/docs/latest/commands/ft.aggregate/#return
    // starts returning valid values
    // assert.equal(res.Results.total_results, 2);

    const normalizedRes = normalizeObject(res);
    assert.ok(normalizedRes.Profile.Shards);
  }, GLOBAL.SERVERS.OPEN_3);
});

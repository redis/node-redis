import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MRANGE_SELECTED_LABELS_GROUPBY, { TsMRangeSelectedLabelsGroupByRawReply2, TsMRangeWithLabelsGroupByRawReply3 } from './MRANGE_SELECTED_LABELS_GROUPBY';
import { TIME_SERIES_REDUCERS } from './MRANGE_GROUPBY';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.MRANGE_SELECTED_LABELS_GROUPBY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MRANGE_SELECTED_LABELS_GROUPBY, '-', '+', 'label', 'label=value', {
        REDUCE: TIME_SERIES_REDUCERS.AVG,
        label: 'label'
      }, {
        LATEST: true,
        FILTER_BY_TS: [0],
        FILTER_BY_VALUE: {
          min: 0,
          max: 1
        },
        COUNT: 1,
        ALIGN: '-',
        AGGREGATION: {
          type: TIME_SERIES_AGGREGATION_TYPE.AVG,
          timeBucket: 1
        }
      }),
      [
        'TS.MRANGE', '-', '+',
        'LATEST',
        'FILTER_BY_TS', '0',
        'FILTER_BY_VALUE', '0', '1',
        'COUNT', '1',
        'ALIGN', '-', 'AGGREGATION', 'AVG', '1',
        'SELECTED_LABELS', 'label',
        'FILTER', 'label=value',
        'GROUPBY', 'label', 'REDUCE', 'AVG'
      ]
    );
  });

  describe('transformReply', () => {
    it('extracts __reducer__ and __source__ from RESP2 grouped labels', () => {
      assert.deepStrictEqual(
        MRANGE_SELECTED_LABELS_GROUPBY.transformReply[2]([
          ['key', [
            ['label', 'value'],
            ['__reducer__', 'avg'],
            ['__source__', 'key']
          ], [
            [0, '1']
          ]]
        ] as unknown as TsMRangeSelectedLabelsGroupByRawReply2),
        {
          key: {
            labels: {
              label: 'value'
            },
            sources: ['key'],
            samples: [{
              timestamp: 0,
              value: 1
            }]
          }
        }
      );
    });

    it('extracts sources from RESP3 grouped metadata', () => {
      const metadata2 = new Map([['sources', ['key']]]);
      assert.deepStrictEqual(
        MRANGE_SELECTED_LABELS_GROUPBY.transformReply[3](new Map([
          ['key', [
            new Map([['label', 'value']]),
            undefined,
            metadata2,
            [[0, 1]]
          ]]
        ]) as unknown as TsMRangeWithLabelsGroupByRawReply3),
        new Map([
          ['key', {
            labels: new Map([
              ['label', 'value']
            ]),
            sources: ['key'],
            samples: [{
              timestamp: 0,
              value: 1
            }]
          }]
        ])
      );
    });
  });

  testUtils.testWithClient('client.ts.mRangeSelectedLabelsGroupBy', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: { label: 'value' }
      }),
      client.ts.mRangeSelectedLabelsGroupBy('-', '+', ['label', 'NX'], 'label=value', {
        REDUCE: TIME_SERIES_REDUCERS.AVG,
        label: 'label'
      })
    ]);

    assert.deepStrictEqual(
      reply,
      Object.defineProperties({}, {
        'label=value': {
          configurable: true,
          enumerable: true,
          value: {
            labels: Object.defineProperties({}, {
              label: {
                configurable: true,
                enumerable: true,
                value: 'value'
              },
              NX: {
                configurable: true,
                enumerable: true,
                value: null
              }
            }),
            sources: ['key'],
            samples: [{
              timestamp: 0,
              value: 0
            }]
          }
        }
      })
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.ts.mRangeSelectedLabelsGroupBy with data', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: { label: 'value' }
      }),
      client.ts.mRangeSelectedLabelsGroupBy('-', '+', ['label', 'NX'], 'label=value', {
        REDUCE: TIME_SERIES_REDUCERS.AVG,
        label: 'label'
      })
    ]);

    // Transformed reply is an object keyed by group
    assert.ok(typeof reply === 'object' && !Array.isArray(reply));
    assert.ok('label=value' in reply);

    const entry = reply['label=value'];

    // Labels should be an object
    assert.ok(typeof entry.labels === 'object' && !Array.isArray(entry.labels));
    assert.equal(entry.labels['label'], 'value');
    assert.equal(entry.labels['NX'], null);

    // Sample values should be numbers
    assert.equal(entry.samples.length, 1);
    assert.equal(typeof entry.samples[0].value, 'number');
    assert.equal(entry.samples[0].value, 0);
    assert.equal(entry.samples[0].timestamp, 0);
  }, GLOBAL.SERVERS.OPEN);
});

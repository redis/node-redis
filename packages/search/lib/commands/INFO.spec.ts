import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import INFO, { InfoReply } from './INFO';
import { SCHEMA_FIELD_TYPE } from './CREATE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('INFO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(INFO, 'index'),
      ['FT.INFO', 'index']
    );
  });

  testUtils.testWithClientIfVersionWithinRange([[8], 'LATEST'], 'client.ft.info', async client => {

    await client.ft.create('index', {
      field: SCHEMA_FIELD_TYPE.TEXT
    });
    const ret = await client.ft.info('index');
    assert.equal(ret.index_name, 'index');

  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[7, 4, 2], [7, 4, 2]], 'client.ft.info', async client => {

    await client.ft.create('index', {
      field: SCHEMA_FIELD_TYPE.TEXT
    });
    const ret = await client.ft.info('index');
    // effectively testing that stopwords_list is not in ret
    assert.deepEqual(
      ret,
      {
        index_name: 'index',
        index_options: [],
        index_definition: Object.create(null, {
          default_score: {
            value: '1',
            configurable: true,
            enumerable: true
          },
          key_type: {
            value: 'HASH',
            configurable: true,
            enumerable: true
          },
          prefixes: {
            value: [''],
            configurable: true,
            enumerable: true
          }
        }),
        attributes: [Object.create(null, {
          identifier: {
            value: 'field',
            configurable: true,
            enumerable: true
          },
          attribute: {
            value: 'field',
            configurable: true,
            enumerable: true
          },
          type: {
            value: 'TEXT',
            configurable: true,
            enumerable: true
          },
          WEIGHT: {
            value: '1',
            configurable: true,
            enumerable: true
          }
        })],
        num_docs: 0,
        max_doc_id: 0,
        num_terms: 0,
        num_records: 0,
        inverted_sz_mb: 0,
        vector_index_sz_mb: 0,
        total_inverted_index_blocks: 0,
        offset_vectors_sz_mb: 0,
        doc_table_size_mb: 0,
        sortable_values_size_mb: 0,
        key_table_size_mb: 0,
        records_per_doc_avg: NaN,
        bytes_per_record_avg: NaN,
        cleaning: 0,
        offsets_per_term_avg: NaN,
        offset_bits_per_record_avg: NaN,
        geoshapes_sz_mb: 0,
        hash_indexing_failures: 0,
        indexing: 0,
        percent_indexed: 1,
        number_of_uses: 1,
        tag_overhead_sz_mb: 0,
        text_overhead_sz_mb: 0,
        total_index_memory_sz_mb: 0,
        total_indexing_time: 0,
        gc_stats: {
          bytes_collected: 0,
          total_ms_run: 0,
          total_cycles: 0,
          average_cycle_time_ms: NaN,
          last_run_time_ms: 0,
          gc_numeric_trees_missed: 0,
          gc_blocks_denied: 0
        },
        cursor_stats: {
          global_idle: 0,
          global_total: 0,
          index_capacity: 128,
          index_total: 0
        },
      }
    );

  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[7, 2, 0], [7, 2, 0]], 'client.ft.info', async client => {

    await client.ft.create('index', {
      field: SCHEMA_FIELD_TYPE.TEXT
    });
    const ret = await client.ft.info('index');
    // effectively testing that stopwords_list is not in ret
    assert.deepEqual(
      ret,
      {
        index_name: 'index',
        index_options: [],
        index_definition: Object.create(null, {
          default_score: {
            value: '1',
            configurable: true,
            enumerable: true
          },
          key_type: {
            value: 'HASH',
            configurable: true,
            enumerable: true
          },
          prefixes: {
            value: [''],
            configurable: true,
            enumerable: true
          }
        }),
        attributes: [Object.create(null, {
          identifier: {
            value: 'field',
            configurable: true,
            enumerable: true
          },
          attribute: {
            value: 'field',
            configurable: true,
            enumerable: true
          },
          type: {
            value: 'TEXT',
            configurable: true,
            enumerable: true
          },
          WEIGHT: {
            value: '1',
            configurable: true,
            enumerable: true
          }
        })],
        num_docs: "0",
        max_doc_id: "0",
        num_terms: "0",
        num_records: "0",
        inverted_sz_mb: 0,
        vector_index_sz_mb: 0,
        total_inverted_index_blocks: "0",
        offset_vectors_sz_mb: 0,
        doc_table_size_mb: 0,
        sortable_values_size_mb: 0,
        key_table_size_mb: 0,
        records_per_doc_avg: NaN,
        bytes_per_record_avg: NaN,
        cleaning: 0,
        offsets_per_term_avg: NaN,
        offset_bits_per_record_avg: NaN,
        geoshapes_sz_mb: 0,
        hash_indexing_failures: "0",
        indexing: "0",
        percent_indexed: 1,
        number_of_uses: 1,
        tag_overhead_sz_mb: 0,
        text_overhead_sz_mb: 0,
        total_index_memory_sz_mb: 0,
        total_indexing_time: 0,
        gc_stats: {
          bytes_collected: 0,
          total_ms_run: 0,
          total_cycles: 0,
          average_cycle_time_ms: NaN,
          last_run_time_ms: 0,
          gc_numeric_trees_missed: 0,
          gc_blocks_denied: 0
        },
        cursor_stats: {
          global_idle: 0,
          global_total: 0,
          index_capacity: 128,
          index_total: 0
        },
      }
    );

  }, GLOBAL.SERVERS.OPEN);
});

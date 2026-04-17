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
    assert.ok(ret !== null && typeof ret === 'object');
    assert.equal(ret.index_name, 'index');

    assert.ok(Array.isArray(ret.index_options));
    assert.ok(ret.index_definition !== null && typeof ret.index_definition === 'object');
    assert.equal(ret.index_definition.key_type, 'HASH');
    assert.ok(Array.isArray(ret.index_definition.prefixes));
    assert.equal(Number(ret.index_definition.default_score), 1);

    assert.ok(Array.isArray(ret.attributes));
    assert.equal(ret.attributes.length, 1);
    assert.ok(ret.attributes[0] !== null && typeof ret.attributes[0] === 'object');
    assert.equal(ret.attributes[0].identifier, 'field');
    assert.equal(ret.attributes[0].attribute, 'field');
    assert.equal(ret.attributes[0].type, 'TEXT');
    assert.equal(Number(ret.attributes[0].WEIGHT), 1);

    assert.equal(typeof ret.num_docs, 'number');
    assert.equal(typeof ret.max_doc_id, 'number');
    assert.equal(typeof ret.num_terms, 'number');
    assert.equal(typeof ret.num_records, 'number');
    assert.equal(typeof ret.inverted_sz_mb, 'number');
    assert.equal(typeof ret.vector_index_sz_mb, 'number');
    assert.equal(typeof ret.total_inverted_index_blocks, 'number');
    assert.equal(typeof ret.offset_vectors_sz_mb, 'number');
    assert.equal(typeof ret.doc_table_size_mb, 'number');
    assert.equal(typeof ret.sortable_values_size_mb, 'number');
    assert.equal(typeof ret.key_table_size_mb, 'number');
    assert.equal(typeof ret.records_per_doc_avg, 'number');
    assert.equal(typeof ret.bytes_per_record_avg, 'number');
    assert.equal(typeof ret.cleaning, 'number');
    assert.equal(typeof ret.offsets_per_term_avg, 'number');
    assert.equal(typeof ret.offset_bits_per_record_avg, 'number');
    assert.equal(typeof ret.geoshapes_sz_mb, 'number');
    assert.equal(typeof ret.hash_indexing_failures, 'number');
    assert.equal(typeof ret.indexing, 'number');
    assert.equal(typeof ret.percent_indexed, 'number');
    assert.equal(typeof ret.number_of_uses, 'number');
    assert.equal(typeof ret.tag_overhead_sz_mb, 'number');
    assert.equal(typeof ret.text_overhead_sz_mb, 'number');
    assert.equal(typeof ret.total_index_memory_sz_mb, 'number');
    assert.equal(typeof ret.total_indexing_time, 'number');

    assert.ok(ret.gc_stats !== null && typeof ret.gc_stats === 'object');
    assert.equal(typeof ret.gc_stats.bytes_collected, 'number');
    assert.equal(typeof ret.gc_stats.total_ms_run, 'number');
    assert.equal(typeof ret.gc_stats.total_cycles, 'number');
    assert.equal(typeof ret.gc_stats.average_cycle_time_ms, 'number');
    assert.equal(typeof ret.gc_stats.last_run_time_ms, 'number');
    assert.equal(typeof ret.gc_stats.gc_numeric_trees_missed, 'number');
    assert.equal(typeof ret.gc_stats.gc_blocks_denied, 'number');

    assert.ok(ret.cursor_stats !== null && typeof ret.cursor_stats === 'object');
    assert.equal(typeof ret.cursor_stats.global_idle, 'number');
    assert.equal(typeof ret.cursor_stats.global_total, 'number');
    assert.equal(typeof ret.cursor_stats.index_capacity, 'number');
    assert.equal(typeof ret.cursor_stats.index_total, 'number');

    if (ret.stopwords_list !== undefined) {
      assert.ok(Array.isArray(ret.stopwords_list));
    }

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
        index_definition: Object.defineProperties({}, {
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
        attributes: [Object.defineProperties({}, {
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
        index_definition: Object.defineProperties({}, {
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
        attributes: [Object.defineProperties({}, {
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

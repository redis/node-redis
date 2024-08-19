import { RedisArgument } from "@redis/client";
import { ArrayReply, BlobStringReply, Command, NumberReply, ReplyUnion } from "@redis/client/dist/lib/RESP/types";
import { transformTuplesReply } from "@redis/client/dist/lib/commands/generic-transformers";

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(index: RedisArgument) {
    return ['FT.INFO', index];
  },
  transformReply: {
    2: transformV2Reply,
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3SearchModule: true
} as const satisfies Command;

type InfoRawReply = [
  'index_name',
  BlobStringReply,
  'index_options',
  ArrayReply<BlobStringReply>,
  'index_definition',
  ArrayReply<BlobStringReply>,
  'attributes',
  Array<ArrayReply<BlobStringReply>>,
  'num_docs',
  BlobStringReply,
  'max_doc_id',
  BlobStringReply,
  'num_terms',
  BlobStringReply,
  'num_records',
  BlobStringReply,
  'inverted_sz_mb',
  BlobStringReply,
  'vector_index_sz_mb',
  BlobStringReply,
  'total_inverted_index_blocks',
  BlobStringReply,
  'offset_vectors_sz_mb',
  BlobStringReply,
  'doc_table_size_mb',
  BlobStringReply,
  'sortable_values_size_mb',
  BlobStringReply,
  'key_table_size_mb',
  BlobStringReply,
  'records_per_doc_avg',
  BlobStringReply,
  'bytes_per_record_avg',
  BlobStringReply,
  'offsets_per_term_avg',
  BlobStringReply,
 'offset_bits_per_record_avg',
  BlobStringReply,
  'hash_indexing_failures',
  BlobStringReply,
  'indexing',
  BlobStringReply,
  'percent_indexed',
   BlobStringReply,
  'gc_stats',
  [
    'bytes_collected',
    BlobStringReply,
    'total_ms_run',
    BlobStringReply,
    'total_cycles',
    BlobStringReply,
    'average_cycle_time_ms',
    BlobStringReply,
    'last_run_time_ms',
    BlobStringReply,
    'gc_numeric_trees_missed',
    BlobStringReply,
    'gc_blocks_denied',
    BlobStringReply
  ],
  'cursor_stats',
  [
     'global_idle',
      NumberReply,
      'global_total',
      NumberReply,
      'index_capacity',
      NumberReply,
      'index_total',
      NumberReply,
  ],
  'stopwords_list'?,
  ArrayReply<BlobStringReply>?
];

export interface InfoReply {
  indexName: BlobStringReply;
  indexOptions: ArrayReply<BlobStringReply>;
  indexDefinition: Record<string, BlobStringReply>;
  attributes: Array<Record<string, BlobStringReply>>;
  numDocs: BlobStringReply
  maxDocId: BlobStringReply;
  numTerms: BlobStringReply;
  numRecords: BlobStringReply;
  invertedSzMb: BlobStringReply;
  vectorIndexSzMb: BlobStringReply;
  totalInvertedIndexBlocks: BlobStringReply;
  offsetVectorsSzMb: BlobStringReply;
  docTableSizeMb: BlobStringReply;
  sortableValuesSizeMb: BlobStringReply;
  keyTableSizeMb: BlobStringReply;
  recordsPerDocAvg: BlobStringReply;
  bytesPerRecordAvg: BlobStringReply;
  offsetsPerTermAvg: BlobStringReply;
  offsetBitsPerRecordAvg: BlobStringReply;
  hashIndexingFailures: BlobStringReply;
  indexing: BlobStringReply;
  percentIndexed: BlobStringReply;
  gcStats: {
    bytesCollected: BlobStringReply;
    totalMsRun: BlobStringReply;
    totalCycles: BlobStringReply;
    averageCycleTimeMs: BlobStringReply;
    lastRunTimeMs: BlobStringReply;
    gcNumericTreesMissed: BlobStringReply;
    gcBlocksDenied: BlobStringReply;
  };
  cursorStats: {
    globalIdle: NumberReply;
    globalTotal: NumberReply;
    indexCapacity: NumberReply;
    idnexTotal: NumberReply;
  };
  stopWords: ArrayReply<BlobStringReply> | undefined;
}

function transformV2Reply(rawReply: InfoRawReply): InfoReply {
  return {
    indexName: rawReply[1],
    indexOptions: rawReply[3],
    indexDefinition: transformTuplesReply(rawReply[5]),
    attributes: rawReply[7].map(attribute => transformTuplesReply(attribute)),
    numDocs: rawReply[9],
    maxDocId: rawReply[11],
    numTerms: rawReply[13],
    numRecords: rawReply[15],
    invertedSzMb: rawReply[17],
    vectorIndexSzMb: rawReply[19],
    totalInvertedIndexBlocks: rawReply[21],
    offsetVectorsSzMb: rawReply[23],
    docTableSizeMb: rawReply[25],
    sortableValuesSizeMb: rawReply[27],
    keyTableSizeMb: rawReply[29],
    recordsPerDocAvg: rawReply[31],
    bytesPerRecordAvg: rawReply[33],
    offsetsPerTermAvg: rawReply[35],
    offsetBitsPerRecordAvg: rawReply[37],
    hashIndexingFailures: rawReply[39],
    indexing: rawReply[41],
    percentIndexed: rawReply[43],
    gcStats: {
      bytesCollected: rawReply[45][1],
      totalMsRun: rawReply[45][3],
      totalCycles: rawReply[45][5],
      averageCycleTimeMs: rawReply[45][7],
      lastRunTimeMs: rawReply[45][9],
      gcNumericTreesMissed: rawReply[45][11],
      gcBlocksDenied: rawReply[45][13]
    },
    cursorStats: {
      globalIdle: rawReply[47][1],
      globalTotal: rawReply[47][3],
      indexCapacity: rawReply[47][5],
      idnexTotal: rawReply[47][7]
    },
    stopWords: rawReply[49]
  };
}

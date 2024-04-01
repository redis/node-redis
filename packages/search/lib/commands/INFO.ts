import { ValkeyCommandArgument } from "@valkey/client/dist/lib/commands";
import { transformTuplesReply } from "@valkey/client/dist/lib/commands/generic-transformers";

export function transformArguments(index: string): Array<string> {
  return ["FT.INFO", index];
}

type InfoRawReply = [
  "index_name",
  ValkeyCommandArgument,
  "index_options",
  Array<ValkeyCommandArgument>,
  "index_definition",
  Array<ValkeyCommandArgument>,
  "attributes",
  Array<Array<ValkeyCommandArgument>>,
  "num_docs",
  ValkeyCommandArgument,
  "max_doc_id",
  ValkeyCommandArgument,
  "num_terms",
  ValkeyCommandArgument,
  "num_records",
  ValkeyCommandArgument,
  "inverted_sz_mb",
  ValkeyCommandArgument,
  "vector_index_sz_mb",
  ValkeyCommandArgument,
  "total_inverted_index_blocks",
  ValkeyCommandArgument,
  "offset_vectors_sz_mb",
  ValkeyCommandArgument,
  "doc_table_size_mb",
  ValkeyCommandArgument,
  "sortable_values_size_mb",
  ValkeyCommandArgument,
  "key_table_size_mb",
  ValkeyCommandArgument,
  "records_per_doc_avg",
  ValkeyCommandArgument,
  "bytes_per_record_avg",
  ValkeyCommandArgument,
  "offsets_per_term_avg",
  ValkeyCommandArgument,
  "offset_bits_per_record_avg",
  ValkeyCommandArgument,
  "hash_indexing_failures",
  ValkeyCommandArgument,
  "indexing",
  ValkeyCommandArgument,
  "percent_indexed",
  ValkeyCommandArgument,
  "gc_stats",
  [
    "bytes_collected",
    ValkeyCommandArgument,
    "total_ms_run",
    ValkeyCommandArgument,
    "total_cycles",
    ValkeyCommandArgument,
    "average_cycle_time_ms",
    ValkeyCommandArgument,
    "last_run_time_ms",
    ValkeyCommandArgument,
    "gc_numeric_trees_missed",
    ValkeyCommandArgument,
    "gc_blocks_denied",
    ValkeyCommandArgument
  ],
  "cursor_stats",
  [
    "global_idle",
    number,
    "global_total",
    number,
    "index_capacity",
    number,
    "index_total",
    number
  ],
  "stopwords_list"?,
  Array<ValkeyCommandArgument>?
];

interface InfoReply {
  indexName: ValkeyCommandArgument;
  indexOptions: Array<ValkeyCommandArgument>;
  indexDefinition: Record<string, ValkeyCommandArgument>;
  attributes: Array<Record<string, ValkeyCommandArgument>>;
  numDocs: ValkeyCommandArgument;
  maxDocId: ValkeyCommandArgument;
  numTerms: ValkeyCommandArgument;
  numRecords: ValkeyCommandArgument;
  invertedSzMb: ValkeyCommandArgument;
  vectorIndexSzMb: ValkeyCommandArgument;
  totalInvertedIndexBlocks: ValkeyCommandArgument;
  offsetVectorsSzMb: ValkeyCommandArgument;
  docTableSizeMb: ValkeyCommandArgument;
  sortableValuesSizeMb: ValkeyCommandArgument;
  keyTableSizeMb: ValkeyCommandArgument;
  recordsPerDocAvg: ValkeyCommandArgument;
  bytesPerRecordAvg: ValkeyCommandArgument;
  offsetsPerTermAvg: ValkeyCommandArgument;
  offsetBitsPerRecordAvg: ValkeyCommandArgument;
  hashIndexingFailures: ValkeyCommandArgument;
  indexing: ValkeyCommandArgument;
  percentIndexed: ValkeyCommandArgument;
  gcStats: {
    bytesCollected: ValkeyCommandArgument;
    totalMsRun: ValkeyCommandArgument;
    totalCycles: ValkeyCommandArgument;
    averageCycleTimeMs: ValkeyCommandArgument;
    lastRunTimeMs: ValkeyCommandArgument;
    gcNumericTreesMissed: ValkeyCommandArgument;
    gcBlocksDenied: ValkeyCommandArgument;
  };
  cursorStats: {
    globalIdle: number;
    globalTotal: number;
    indexCapacity: number;
    idnexTotal: number;
  };
  stopWords: Array<ValkeyCommandArgument> | undefined;
}

export function transformReply(rawReply: InfoRawReply): InfoReply {
  return {
    indexName: rawReply[1],
    indexOptions: rawReply[3],
    indexDefinition: transformTuplesReply(rawReply[5]),
    attributes: rawReply[7].map((attribute) => transformTuplesReply(attribute)),
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
      gcBlocksDenied: rawReply[45][13],
    },
    cursorStats: {
      globalIdle: rawReply[47][1],
      globalTotal: rawReply[47][3],
      indexCapacity: rawReply[47][5],
      idnexTotal: rawReply[47][7],
    },
    stopWords: rawReply[49],
  };
}

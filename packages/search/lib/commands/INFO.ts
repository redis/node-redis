import { RedisCommandArgument } from '@redis/client/dist/lib/commands';
import { transformTuplesReply } from '@redis/client/dist/lib/commands/generic-transformers';

export function transformArguments(index: string): Array<string> {
    return ['FT.INFO', index];
}

type InfoRawReply = [
    'index_name',
    RedisCommandArgument,
    'index_options',
    Array<RedisCommandArgument>,
    'index_definition',
    Array<RedisCommandArgument>,
    'attributes',
    Array<Array<RedisCommandArgument>>,
    'num_docs',
    RedisCommandArgument,
    'max_doc_id',
    RedisCommandArgument,
    'num_terms',
    RedisCommandArgument,
    'num_records',
    RedisCommandArgument,
    'inverted_sz_mb',
    RedisCommandArgument,
    'vector_index_sz_mb',
    RedisCommandArgument,
    'total_inverted_index_blocks',
    RedisCommandArgument,
    'offset_vectors_sz_mb',
    RedisCommandArgument,
    'doc_table_size_mb',
    RedisCommandArgument,
    'sortable_values_size_mb',
    RedisCommandArgument,
    'key_table_size_mb',
    RedisCommandArgument,
    'records_per_doc_avg',
    RedisCommandArgument,
    'bytes_per_record_avg',
    RedisCommandArgument,
    'offsets_per_term_avg',
    RedisCommandArgument,
    'offset_bits_per_record_avg',
    RedisCommandArgument,
    'hash_indexing_failures',
    RedisCommandArgument,
    'indexing',
    RedisCommandArgument,
    'percent_indexed',
    RedisCommandArgument,
    'gc_stats',
    [
        'bytes_collected',
        RedisCommandArgument,
        'total_ms_run',
        RedisCommandArgument,
        'total_cycles',
        RedisCommandArgument,
        'average_cycle_time_ms',
        RedisCommandArgument,
        'last_run_time_ms',
        RedisCommandArgument,
        'gc_numeric_trees_missed',
        RedisCommandArgument,
        'gc_blocks_denied',
        RedisCommandArgument
    ],
    'cursor_stats',
    [
        'global_idle',
        number,
        'global_total',
        number,
        'index_capacity',
        number,
        'index_total',
        number
    ],
    'stopwords_list'?,
    Array<RedisCommandArgument>?
];

interface InfoReply {
    indexName: RedisCommandArgument;
    indexOptions: Array<RedisCommandArgument>;
    indexDefinition: Record<string, RedisCommandArgument>;
    attributes: Array<Record<string, RedisCommandArgument>>;
    numDocs: RedisCommandArgument;
    maxDocId: RedisCommandArgument;
    numTerms: RedisCommandArgument;
    numRecords: RedisCommandArgument;
    invertedSzMb: RedisCommandArgument;
    vectorIndexSzMb: RedisCommandArgument;
    totalInvertedIndexBlocks: RedisCommandArgument;
    offsetVectorsSzMb: RedisCommandArgument;
    docTableSizeMb: RedisCommandArgument;
    sortableValuesSizeMb: RedisCommandArgument;
    keyTableSizeMb: RedisCommandArgument;
    recordsPerDocAvg: RedisCommandArgument;
    bytesPerRecordAvg: RedisCommandArgument;
    offsetsPerTermAvg: RedisCommandArgument;
    offsetBitsPerRecordAvg: RedisCommandArgument;
    hashIndexingFailures: RedisCommandArgument;
    indexing: RedisCommandArgument;
    percentIndexed: RedisCommandArgument;
    gcStats: {
        bytesCollected: RedisCommandArgument;
        totalMsRun: RedisCommandArgument;
        totalCycles: RedisCommandArgument;
        averageCycleTimeMs: RedisCommandArgument;
        lastRunTimeMs: RedisCommandArgument;
        gcNumericTreesMissed: RedisCommandArgument;
        gcBlocksDenied: RedisCommandArgument;
    };
    cursorStats: {
        globalIdle: number;
        globalTotal: number;
        indexCapacity: number;
        idnexTotal: number;
    };
    stopWords: Array<RedisCommandArgument> | undefined;
}

export function transformReply(rawReply: InfoRawReply): InfoReply {
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

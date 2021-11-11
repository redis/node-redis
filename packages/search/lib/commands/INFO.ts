export function transformArguments(index: string): Array<string> {
    return ['FT.INFO', index];
}

type InfoRawReply = [
    _: string,
    indexName: string,
    _: string,
    indexOptions: Array<string>,
    _: string,
    indexDefinition: [
        _: string,
        keyType: string,
        _: string,
        prefixes: Array<string>,
        _: string,
        defaultScore: string
    ],
    _: string,
    attributes: Array<Array<string>>,
    _: string,
    numDocs: string,
    _: string,
    maxDocId: string,
    _: string,
    numTerms: string,
    _: string,
    numRecords: string,
    _: string,
    invertedSzMb: string,
    _: string,
    totalInvertedIndexBlocks: string,
    _: string,
    offsetVectorsSzMb: string,
    _: string,
    docTableSizeMb: string,
    _: string,
    sortableValuesSizeMb: string,
    _: string,
    keyTableSizeMb: string,
    _: string,
    recordsPerDocAvg: string,
    _: string,
    bytesPerRecordAvg: string,
    _: string,
    offsetsPerTermAvg: string,
    _: string,
    offsetBitsPerRecordAvg: string,
    _: string,
    hashIndexingFailures: string,
    _: string,
    indexing: string,
    _: string,
    percentIndexed: string,
    _: string,
    gcStats: [
        _: string,
        bytesCollected: string,
        _: string,
        totalMsRun: string,
        _: string,
        totalCycles: string,
        _: string,
        averageCycleTimeMs: string,
        _: string,
        lastRunTimeMs: string,
        _: string,
        gcNumericTreesMissed: string,
        _: string,
        gcBlocksDenied: string
    ],
    _: string,
    cursorStats: [
        _: string,
        globalIdle: number,
        _: string,
        globalTotal: number,
        _: string,
        indexCapacity: number,
        _: string,
        idnexTotal: number
    ]
];

interface InfoReply {
    indexName: string;
    indexOptions: Array<string>;
    indexDefinition: {
        keyType: string;
        prefixes: Array<string>;
        defaultScore: string;
    };
    attributes: Array<Array<string>>;
    numDocs: string;
    maxDocId: string;
    numTerms: string;
    numRecords: string;
    invertedSzMb: string;
    totalInvertedIndexBlocks: string;
    offsetVectorsSzMb: string;
    docTableSizeMb: string;
    sortableValuesSizeMb: string;
    keyTableSizeMb: string;
    recordsPerDocAvg: string;
    bytesPerRecordAvg: string;
    offsetsPerTermAvg: string;
    offsetBitsPerRecordAvg: string;
    hashIndexingFailures: string;
    indexing: string;
    percentIndexed: string;
    gcStats: {
        bytesCollected: string;
        totalMsRun: string;
        totalCycles: string;
        averageCycleTimeMs: string;
        lastRunTimeMs: string;
        gcNumericTreesMissed: string;
        gcBlocksDenied: string;
    };
    cursorStats: {
        globalIdle: number;
        globalTotal: number;
        indexCapacity: number;
        idnexTotal: number;
    };
}

export function transformReply(rawReply: InfoRawReply): InfoReply {
    return {
        indexName: rawReply[1],
        indexOptions: rawReply[3],
        indexDefinition: {
            keyType: rawReply[5][1],
            prefixes: rawReply[5][3],
            defaultScore: rawReply[5][5]
        },
        attributes: rawReply[7],
        numDocs: rawReply[9],
        maxDocId: rawReply[11],
        numTerms: rawReply[13],
        numRecords: rawReply[15],
        invertedSzMb: rawReply[17],
        totalInvertedIndexBlocks: rawReply[19],
        offsetVectorsSzMb: rawReply[21],
        docTableSizeMb: rawReply[23],
        sortableValuesSizeMb: rawReply[25],
        keyTableSizeMb: rawReply[27],
        recordsPerDocAvg: rawReply[29],
        bytesPerRecordAvg: rawReply[31],
        offsetsPerTermAvg: rawReply[33],
        offsetBitsPerRecordAvg: rawReply[35],
        hashIndexingFailures: rawReply[37],
        indexing: rawReply[39],
        percentIndexed: rawReply[41],
        gcStats: {
            bytesCollected: rawReply[43][1],
            totalMsRun: rawReply[43][3],
            totalCycles: rawReply[43][5],
            averageCycleTimeMs: rawReply[43][7],
            lastRunTimeMs: rawReply[43][9],
            gcNumericTreesMissed: rawReply[43][11],
            gcBlocksDenied: rawReply[43][13]
        },
        cursorStats: {
            globalIdle: rawReply[45][1],
            globalTotal: rawReply[45][3],
            indexCapacity: rawReply[45][5],
            idnexTotal: rawReply[45][7]
        }
    };
}

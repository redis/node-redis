import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import INFO from './INFO';
import { SCHEMA_FIELD_TYPE } from './CREATE';

describe('INFO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            INFO.transformArguments('index'),
            ['FT.INFO', 'index']
        );
    });

    testUtils.testWithClient('client.ft.info', async client => {
        await client.ft.create('index', {
            field: SCHEMA_FIELD_TYPE.TEXT
        });
        assert.deepEqual(
            await client.ft.info('index'),
            {
                indexName: 'index',
                indexOptions: [],
                indexDefinition: Object.create(null, {
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
                numDocs: '0',
                maxDocId: '0',
                numTerms: '0',
                numRecords: '0',
                invertedSzMb: '0',
                vectorIndexSzMb: '0',
                totalInvertedIndexBlocks: '0',
                offsetVectorsSzMb: '0',
                docTableSizeMb: '0',
                sortableValuesSizeMb: '0',
                keyTableSizeMb: '0',
                recordsPerDocAvg: '-nan',
                bytesPerRecordAvg: '-nan',
                offsetsPerTermAvg: '-nan',
                offsetBitsPerRecordAvg: '-nan',
                hashIndexingFailures: '0',
                indexing: '0',
                percentIndexed: '1',
                gcStats: {
                    bytesCollected: '0',
                    totalMsRun: '0',
                    totalCycles: '0',
                    averageCycleTimeMs: '-nan',
                    lastRunTimeMs: '0',
                    gcNumericTreesMissed: '0',
                    gcBlocksDenied: '0'
                },
                cursorStats: {
                    globalIdle: 0,
                    globalTotal: 0,
                    indexCapacity: 128,
                    idnexTotal: 0
                },
                stopWords: undefined
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});

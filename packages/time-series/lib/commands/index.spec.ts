import { RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { strict as assert } from 'assert';
import {
    transformTimestampArgument,
    pushRetentionArgument,
    TimeSeriesEncoding,
    pushEncodingArgument,
    pushChunkSizeArgument,
    pushDuplicatePolicy,
    pushLabelsArgument,
    transformIncrDecrArguments,
    transformSampleReply,
    TimeSeriesAggregationType,
    pushRangeArguments,
    pushMRangeGroupByArguments,
    TimeSeriesReducers,
    pushFilterArgument,
    pushMRangeArguments,
    pushWithLabelsArgument,
    pushMRangeWithLabelsArguments,
    transformRangeReply,
    transformMRangeReply,
    transformMRangeWithLabelsReply,
    TimeSeriesDuplicatePolicies,
    pushLatestArgument,
    TimeSeriesBucketTimestamp
} from '.';

describe('transformTimestampArgument', () => {
    it('number', () => {
        assert.equal(
            transformTimestampArgument(0),
            '0'
        );
    });

    it('Date', () => {
        assert.equal(
            transformTimestampArgument(new Date(0)),
            '0'
        );
    });

    it('string', () => {
        assert.equal(
            transformTimestampArgument('*'),
            '*'
        );
    });
});

function testOptionalArgument(fn: (args: RedisCommandArguments) => unknown): void {
    it('undefined', () => {
        assert.deepEqual(
            fn([]),
            []
        );
    });
}

describe('pushRetentionArgument', () => {
    testOptionalArgument(pushRetentionArgument);

    it('number', () => {
        assert.deepEqual(
            pushRetentionArgument([], 1),
            ['RETENTION', '1']
        );
    });
});

describe('pushEncodingArgument', () => {
    testOptionalArgument(pushEncodingArgument);

    it('UNCOMPRESSED', () => {
        assert.deepEqual(
            pushEncodingArgument([], TimeSeriesEncoding.UNCOMPRESSED),
            ['ENCODING', 'UNCOMPRESSED']
        );
    });
});

describe('pushChunkSizeArgument', () => {
    testOptionalArgument(pushChunkSizeArgument);

    it('number', () => {
        assert.deepEqual(
            pushChunkSizeArgument([], 1),
            ['CHUNK_SIZE', '1']
        );
    });
});

describe('pushDuplicatePolicy', () => {
    testOptionalArgument(pushDuplicatePolicy);

    it('BLOCK', () => {
        assert.deepEqual(
            pushDuplicatePolicy([], TimeSeriesDuplicatePolicies.BLOCK),
            ['DUPLICATE_POLICY', 'BLOCK']
        );
    });
});

describe('pushLabelsArgument', () => {
    testOptionalArgument(pushLabelsArgument);

    it("{ label: 'value' }", () => {
        assert.deepEqual(
            pushLabelsArgument([], { label: 'value' }),
            ['LABELS', 'label', 'value']
        );
    });
});

describe('transformIncrDecrArguments', () => {
    it('without options', () => {
        assert.deepEqual(
            transformIncrDecrArguments('TS.INCRBY', 'key', 1),
            ['TS.INCRBY', 'key', '1']
        );
    });

    it('with TIMESTAMP', () => {
        assert.deepEqual(
            transformIncrDecrArguments('TS.INCRBY', 'key', 1, {
                TIMESTAMP: '*'
            }),
            ['TS.INCRBY', 'key', '1', 'TIMESTAMP', '*']
        );
    });

    it('with UNCOMPRESSED', () => {
        assert.deepEqual(
            transformIncrDecrArguments('TS.INCRBY', 'key', 1, {
                UNCOMPRESSED: true
            }),
            ['TS.INCRBY', 'key', '1', 'UNCOMPRESSED']
        );
    });

    it('with UNCOMPRESSED false', () => {
        assert.deepEqual(
            transformIncrDecrArguments('TS.INCRBY', 'key', 1, {
                UNCOMPRESSED: false
            }),
            ['TS.INCRBY', 'key', '1']
        );
    });
});

it('transformSampleReply', () => {
    assert.deepEqual(
        transformSampleReply([1, '1.1']),
        {
            timestamp: 1,
            value: 1.1
        }
    );
});

describe('pushRangeArguments', () => {
    it('without options', () => {
        assert.deepEqual(
            pushRangeArguments([], '-', '+'),
            ['-', '+']
        );
    });

    describe('with FILTER_BY_TS', () => {
        it('string', () => {
            assert.deepEqual(
                pushRangeArguments([], '-', '+', {
                    FILTER_BY_TS: ['ts']
                }),
                ['-', '+', 'FILTER_BY_TS', 'ts']
            );
        });

        it('Array', () => {
            assert.deepEqual(
                pushRangeArguments([], '-', '+', {
                    FILTER_BY_TS: ['1', '2']
                }),
                ['-', '+', 'FILTER_BY_TS', '1', '2']
            );
        });
    });

    it('with FILTER_BY_VALUE', () => {
        assert.deepEqual(
            pushRangeArguments([], '-', '+', {
                FILTER_BY_VALUE: {
                    min: 1,
                    max: 2
                }
            }),
            ['-', '+', 'FILTER_BY_VALUE', '1', '2']
        );
    });

    it('with COUNT', () => {
        assert.deepEqual(
            pushRangeArguments([], '-', '+', {
                COUNT: 1
            }),
            ['-', '+', 'COUNT', '1']
        );
    });

    it('with ALIGN', () => {
        assert.deepEqual(
            pushRangeArguments([], '-', '+', {
                ALIGN: 1
            }),
            ['-', '+', 'ALIGN', '1']
        );
    });

    describe('with AGGREGATION', () => {
        it('without options', () => {
            assert.deepEqual(
                pushRangeArguments([], '-', '+', {
                    AGGREGATION: {
                        type: TimeSeriesAggregationType.FIRST,
                        timeBucket: 1
                    }
                }),
                ['-', '+', 'AGGREGATION', 'FIRST', '1']
            );
        });

        it('with BUCKETTIMESTAMP', () => {
            assert.deepEqual(
                pushRangeArguments([], '-', '+', {
                    AGGREGATION: {
                        type: TimeSeriesAggregationType.FIRST,
                        timeBucket: 1,
                        BUCKETTIMESTAMP: TimeSeriesBucketTimestamp.LOW
                    }
                }),
                ['-', '+', 'AGGREGATION', 'FIRST', '1', 'BUCKETTIMESTAMP', '-']
            );
        });

        it('with BUCKETTIMESTAMP', () => {
            assert.deepEqual(
                pushRangeArguments([], '-', '+', {
                    AGGREGATION: {
                        type: TimeSeriesAggregationType.FIRST,
                        timeBucket: 1,
                        EMPTY: true
                    }
                }),
                ['-', '+', 'AGGREGATION', 'FIRST', '1', 'EMPTY']
            );
        });
    });

    it('with FILTER_BY_TS, FILTER_BY_VALUE, COUNT, ALIGN, AGGREGATION', () => {
        assert.deepEqual(
            pushRangeArguments([], '-', '+', {
                FILTER_BY_TS: ['ts'],
                FILTER_BY_VALUE: {
                    min: 1,
                    max: 2
                },
                COUNT: 1,
                ALIGN: 1,
                AGGREGATION: {
                    type: TimeSeriesAggregationType.FIRST,
                    timeBucket: 1,
                    BUCKETTIMESTAMP: TimeSeriesBucketTimestamp.LOW,
                    EMPTY: true
                }
            }),
            ['-', '+', 'FILTER_BY_TS', 'ts', 'FILTER_BY_VALUE', '1', '2',
            'COUNT', '1', 'ALIGN', '1', 'AGGREGATION', 'FIRST', '1', 'BUCKETTIMESTAMP', '-', 'EMPTY']
        );
    });
});

describe('pushMRangeGroupByArguments', () => {
    it('undefined', () => {
        assert.deepEqual(
            pushMRangeGroupByArguments([]),
            []
        );
    });

    it('with GROUPBY', () => {
        assert.deepEqual(
            pushMRangeGroupByArguments([], {
                label: 'label',
                reducer: TimeSeriesReducers.MAXIMUM
            }),
            ['GROUPBY', 'label', 'REDUCE', 'MAX']
        );
    });
});

describe('pushFilterArgument', () => {
    it('string', () => {
        assert.deepEqual(
            pushFilterArgument([], 'label=value'),
            ['FILTER', 'label=value']
        );
    });

    it('Array', () => {
        assert.deepEqual(
            pushFilterArgument([], ['1=1', '2=2']),
            ['FILTER', '1=1', '2=2']
        );
    });
});

describe('pushMRangeArguments', () => {
    it('without options', () => {
        assert.deepEqual(
            pushMRangeArguments([], '-', '+', 'label=value'),
            ['-', '+', 'FILTER', 'label=value']
        );
    });

    it('with GROUPBY', () => {
        assert.deepEqual(
            pushMRangeArguments([], '-', '+', 'label=value', {
                GROUPBY: {
                    label: 'label',
                    reducer: TimeSeriesReducers.MAXIMUM
                }
            }),
            ['-', '+', 'FILTER', 'label=value', 'GROUPBY', 'label', 'REDUCE', 'MAX']
        );
    });
});

describe('pushWithLabelsArgument', () => {
    it('without selected labels', () => {
        assert.deepEqual(
            pushWithLabelsArgument([]),
            ['WITHLABELS']
        );
    });

    it('with selected labels', () => {
        assert.deepEqual(
            pushWithLabelsArgument([], ['label']),
            ['SELECTED_LABELS', 'label']
        );
    });
});

it('pushMRangeWithLabelsArguments', () => {
    assert.deepEqual(
        pushMRangeWithLabelsArguments([], '-', '+', 'label=value'),
        ['-', '+', 'WITHLABELS', 'FILTER', 'label=value']
    );
});

it('transformRangeReply', () => {
    assert.deepEqual(
        transformRangeReply([[1, '1.1'], [2, '2.2']]),
        [{
            timestamp: 1,
            value: 1.1
        }, {
            timestamp: 2,
            value: 2.2
        }]
    );
});

describe('transformMRangeReply', () => {
    assert.deepEqual(
        transformMRangeReply([[
            'key',
            [],
            [[1, '1.1'], [2, '2.2']]
        ]]),
        [{
            key: 'key',
            samples: [{
                timestamp: 1,
                value: 1.1
            }, {
                timestamp: 2,
                value: 2.2
            }]
        }]
    );
});

describe('transformMRangeWithLabelsReply', () => {
    assert.deepEqual(
        transformMRangeWithLabelsReply([[
            'key',
            [['label', 'value']],
            [[1, '1.1'], [2, '2.2']]
        ]]),
        [{
            key: 'key',
            labels: {
                label: 'value'
            },
            samples: [{
                timestamp: 1,
                value: 1.1
            }, {
                timestamp: 2,
                value: 2.2
            }]
        }]
    );
});

describe('pushLatestArgument', () => {
    it('undefined', () => {
        assert.deepEqual(
            pushLatestArgument([]),
            []
        );
    });

    it('false', () => {
        assert.deepEqual(
            pushLatestArgument([], false),
            []
        );
    });

    it('true', () => {
        assert.deepEqual(
            pushLatestArgument([], true),
            ['LATEST']
        );
    });
})

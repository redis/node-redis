import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { AggregateGroupByReducers, AggregateSteps, transformArguments } from './AGGREGATE';
import { SchemaFieldTypes } from '.';

describe('AGGREGATE', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('index', '*'),
                ['FT.AGGREGATE', 'index', '*']
            );
        });

        it('with VERBATIM', () => {
            assert.deepEqual(
                transformArguments('index', '*', { VERBATIM: true }),
                ['FT.AGGREGATE', 'index', '*', 'VERBATIM']
            );
        });

        describe('with LOAD', () => {
            describe('single', () => {
                describe('without alias', () => {
                    it('string', () => {
                        assert.deepEqual(
                            transformArguments('index', '*', { LOAD: '@property' }),
                            ['FT.AGGREGATE', 'index', '*', 'LOAD', '1', '@property']
                        );
                    });

                    it('{ identifier: string }', () => {
                        assert.deepEqual(
                            transformArguments('index', '*', {
                                LOAD: {
                                    identifier: '@property'
                                }
                            }),
                            ['FT.AGGREGATE', 'index', '*', 'LOAD', '1', '@property']
                        );
                    });
                });

                it('with alias', () => {
                    assert.deepEqual(
                        transformArguments('index', '*', {
                            LOAD: {
                                identifier: '@property',
                                AS: 'alias'
                            }
                        }),
                        ['FT.AGGREGATE', 'index', '*', 'LOAD', '3', '@property', 'AS', 'alias']
                    );
                });
            });

            it('multiple', () => {
                assert.deepEqual(
                    transformArguments('index', '*', { LOAD: ['@1', '@2'] }),
                    ['FT.AGGREGATE', 'index', '*', 'LOAD', '2', '@1', '@2']
                );
            });
        });

        describe('with STEPS', () => {
            describe('GROUPBY', () => {
                describe('COUNT', () => {
                    describe('without properties', () => {
                        it('without alias', () => {
                            assert.deepEqual(
                                transformArguments('index', '*', {
                                    STEPS: [{
                                        type: AggregateSteps.GROUPBY,
                                        REDUCE: {
                                            type: AggregateGroupByReducers.COUNT
                                        }
                                    }]
                                }),
                                ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COUNT', '0']
                            );
                        });

                        it('with alias', () => {
                            assert.deepEqual(
                                transformArguments('index', '*', {
                                    STEPS: [{
                                        type: AggregateSteps.GROUPBY,
                                        REDUCE: {
                                            type: AggregateGroupByReducers.COUNT,
                                            AS: 'count'
                                        }
                                    }]
                                }),
                                ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COUNT', '0', 'AS', 'count']
                            );
                        });
                    });

                    describe('with properties', () => {
                        it('single', () => {
                            assert.deepEqual(
                                transformArguments('index', '*', {
                                    STEPS: [{
                                        type: AggregateSteps.GROUPBY,
                                        properties: '@property',
                                        REDUCE: {
                                            type: AggregateGroupByReducers.COUNT
                                        }
                                    }]
                                }),
                                ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '1', '@property', 'REDUCE', 'COUNT', '0']
                            );
                        });

                        it('multiple', () => {
                            assert.deepEqual(
                                transformArguments('index', '*', {
                                    STEPS: [{
                                        type: AggregateSteps.GROUPBY,
                                        properties: ['@1', '@2'],
                                        REDUCE: {
                                            type: AggregateGroupByReducers.COUNT
                                        }
                                    }]
                                }),
                                ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '2', '@1', '@2', 'REDUCE', 'COUNT', '0']
                            );
                        });
                    });
                });

                it('COUNT_DISTINCT', () => {
                    assert.deepEqual(
                        transformArguments('index', '*', {
                            STEPS: [{
                                type: AggregateSteps.GROUPBY,
                                REDUCE: {
                                    type: AggregateGroupByReducers.COUNT_DISTINCT,
                                    property: '@property'
                                }
                            }]
                        }),
                        ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COUNT_DISTINCT', '1', '@property']
                    );
                });

                it('COUNT_DISTINCTISH', () => {
                    assert.deepEqual(
                        transformArguments('index', '*', {
                            STEPS: [{
                                type: AggregateSteps.GROUPBY,
                                REDUCE: {
                                    type: AggregateGroupByReducers.COUNT_DISTINCTISH,
                                    property: '@property'
                                }
                            }]
                        }),
                        ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COUNT_DISTINCTISH', '1', '@property']
                    );
                });

                it('SUM', () => {
                    assert.deepEqual(
                        transformArguments('index', '*', {
                            STEPS: [{
                                type: AggregateSteps.GROUPBY,
                                REDUCE: {
                                    type: AggregateGroupByReducers.SUM,
                                    property: '@property'
                                }
                            }]
                        }),
                        ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'SUM', '1', '@property']
                    );
                });

                it('MIN', () => {
                    assert.deepEqual(
                        transformArguments('index', '*', {
                            STEPS: [{
                                type: AggregateSteps.GROUPBY,
                                REDUCE: {
                                    type: AggregateGroupByReducers.MIN,
                                    property: '@property'
                                }
                            }]
                        }),
                        ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'MIN', '1', '@property']
                    );
                });

                it('MAX', () => {
                    assert.deepEqual(
                        transformArguments('index', '*', {
                            STEPS: [{
                                type: AggregateSteps.GROUPBY,
                                REDUCE: {
                                    type: AggregateGroupByReducers.MAX,
                                    property: '@property'
                                }
                            }]
                        }),
                        ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'MAX', '1', '@property']
                    );
                });

                it('AVG', () => {
                    assert.deepEqual(
                        transformArguments('index', '*', {
                            STEPS: [{
                                type: AggregateSteps.GROUPBY,
                                REDUCE: {
                                    type: AggregateGroupByReducers.AVG,
                                    property: '@property'
                                }
                            }]
                        }),
                        ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'AVG', '1', '@property']
                    );
                });

                it('STDDEV', () => {
                    assert.deepEqual(
                        transformArguments('index', '*', {
                            STEPS: [{
                                type: AggregateSteps.GROUPBY,
                                REDUCE: {
                                    type: AggregateGroupByReducers.STDDEV,
                                    property: '@property'
                                }
                            }]
                        }),
                        ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'STDDEV', '1', '@property']
                    );
                });

                it('QUANTILE', () => {
                    assert.deepEqual(
                        transformArguments('index', '*', {
                            STEPS: [{
                                type: AggregateSteps.GROUPBY,
                                REDUCE: {
                                    type: AggregateGroupByReducers.QUANTILE,
                                    property: '@property',
                                    quantile: 0.5
                                }
                            }]
                        }),
                        ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'QUANTILE', '2', '@property', '0.5']
                    );
                });

                it('TO_LIST', () => {
                    assert.deepEqual(
                        transformArguments('index', '*', {
                            STEPS: [{
                                type: AggregateSteps.GROUPBY,
                                REDUCE: {
                                    type: AggregateGroupByReducers.TO_LIST,
                                    property: '@property'
                                }
                            }]
                        }),
                        ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'TOLIST', '1', '@property']
                    );
                });

                describe('FIRST_VALUE', () => {
                    it('simple', () => {
                        assert.deepEqual(
                            transformArguments('index', '*', {
                                STEPS: [{
                                    type: AggregateSteps.GROUPBY,
                                    REDUCE: {
                                        type: AggregateGroupByReducers.FIRST_VALUE,
                                        property: '@property'
                                    }
                                }]
                            }),
                            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'FIRST_VALUE', '1', '@property']
                        );
                    });

                    describe('with BY', () => {
                        describe('without direction', () => {
                            it('string', () => {
                                assert.deepEqual(
                                    transformArguments('index', '*', {
                                        STEPS: [{
                                            type: AggregateSteps.GROUPBY,
                                            REDUCE: {
                                                type: AggregateGroupByReducers.FIRST_VALUE,
                                                property: '@property',
                                                BY: '@by'
                                            }
                                        }]
                                    }),
                                    ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'FIRST_VALUE', '3', '@property', 'BY', '@by']
                                );
                            });


                            it('{ property: string }', () => {
                                assert.deepEqual(
                                    transformArguments('index', '*', {
                                        STEPS: [{
                                            type: AggregateSteps.GROUPBY,
                                            REDUCE: {
                                                type: AggregateGroupByReducers.FIRST_VALUE,
                                                property: '@property',
                                                BY: {
                                                    property: '@by'
                                                }
                                            }
                                        }]
                                    }),
                                    ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'FIRST_VALUE', '3', '@property', 'BY', '@by']
                                );
                            });
                        });

                        it('with direction', () => {
                            assert.deepEqual(
                                transformArguments('index', '*', {
                                    STEPS: [{
                                        type: AggregateSteps.GROUPBY,
                                        REDUCE: {
                                            type: AggregateGroupByReducers.FIRST_VALUE,
                                            property: '@property',
                                            BY: {
                                                property: '@by',
                                                direction: 'ASC'
                                            }
                                        }
                                    }]
                                }),
                                ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'FIRST_VALUE', '4', '@property', 'BY', '@by', 'ASC']
                            );
                        });
                    });
                });

                it('RANDOM_SAMPLE', () => {
                    assert.deepEqual(
                        transformArguments('index', '*', {
                            STEPS: [{
                                type: AggregateSteps.GROUPBY,
                                REDUCE: {
                                    type: AggregateGroupByReducers.RANDOM_SAMPLE,
                                    property: '@property',
                                    sampleSize: 1
                                }
                            }]
                        }),
                        ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'RANDOM_SAMPLE', '2', '@property', '1']
                    );
                });
            });

            describe('SORTBY', () => {
                it('string', () => {
                    assert.deepEqual(
                        transformArguments('index', '*', {
                            STEPS: [{
                                type: AggregateSteps.SORTBY,
                                BY: '@by'
                            }]
                        }),
                        ['FT.AGGREGATE', 'index', '*', 'SORTBY', '1', '@by']
                    );
                });

                it('Array', () => {
                    assert.deepEqual(
                        transformArguments('index', '*', {
                            STEPS: [{
                                type: AggregateSteps.SORTBY,
                                BY: ['@1', '@2']
                            }]
                        }),
                        ['FT.AGGREGATE', 'index', '*', 'SORTBY', '2', '@1', '@2']
                    );
                });

                it('with MAX', () => {
                    assert.deepEqual(
                        transformArguments('index', '*', {
                            STEPS: [{
                                type: AggregateSteps.SORTBY,
                                BY: '@by',
                                MAX: 1
                            }]
                        }),
                        ['FT.AGGREGATE', 'index', '*', 'SORTBY', '1', '@by', 'MAX', '1']
                    );
                });
            });

            describe('APPLY', () => {
                assert.deepEqual(
                    transformArguments('index', '*', {
                        STEPS: [{
                            type: AggregateSteps.APPLY,
                            expression: '@field + 1',
                            AS: 'as'
                        }]
                    }),
                    ['FT.AGGREGATE', 'index', '*', 'APPLY', '@field + 1', 'AS', 'as']
                );
            });

            describe('LIMIT', () => {
                assert.deepEqual(
                    transformArguments('index', '*', {
                        STEPS: [{
                            type: AggregateSteps.LIMIT,
                            from: 0,
                            size: 1
                        }]
                    }),
                    ['FT.AGGREGATE', 'index', '*', 'LIMIT', '0', '1']
                );
            });

            describe('FILTER', () => {
                assert.deepEqual(
                    transformArguments('index', '*', {
                        STEPS: [{
                            type: AggregateSteps.FILTER,
                            expression: '@field != ""'
                        }]
                    }),
                    ['FT.AGGREGATE', 'index', '*', 'FILTER', '@field != ""']
                );
            });
        });

        it('with PARAMS', () => {
            assert.deepEqual(
                transformArguments('index', '*', {
                    PARAMS: {
                        param: 'value'
                    }
                }),
                ['FT.AGGREGATE', 'index', '*', 'PARAMS', '2', 'param', 'value']
            );
        });

        it('with DIALECT', () => {
            assert.deepEqual(
                transformArguments('index', '*', {
                    DIALECT: 1
                }),
                ['FT.AGGREGATE', 'index', '*', 'DIALECT', '1']
            );
        });

        it('with TIMEOUT', () => {
            assert.deepEqual(
                transformArguments('index', '*', { TIMEOUT: 10 }),
                ['FT.AGGREGATE', 'index', '*', 'TIMEOUT', '10']
            );
        });
    });

    testUtils.testWithClient('client.ft.aggregate', async client => {
        await Promise.all([
            client.ft.create('index', {
                field: SchemaFieldTypes.NUMERIC
            }),
            client.hSet('1', 'field', '1'),
            client.hSet('2', 'field', '2')
        ]);

        assert.deepEqual(
            await client.ft.aggregate('index', '*', {
                STEPS: [{
                    type: AggregateSteps.GROUPBY,
                    REDUCE: [{
                        type: AggregateGroupByReducers.SUM,
                        property: '@field',
                        AS: 'sum'
                    }, {
                        type: AggregateGroupByReducers.AVG,
                        property: '@field',
                        AS: 'avg'
                    }]
                }]
            }),
            {
                total: 1,
                results: [
                    Object.create(null, {
                        sum: {
                            value: '3',
                            configurable: true,
                            enumerable: true
                        },
                        avg: {
                            value: '1.5',
                            configurable: true,
                            enumerable: true
                        }
                    })
                ]
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});

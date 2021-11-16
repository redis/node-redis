import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { SchemaFieldTypes, SchemaTextFieldPhonetics, transformArguments } from './CREATE';
import { RedisSearchLanguages } from '.';

describe('CREATE', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('index', {}),
                ['FT.CREATE', 'index', 'SCHEMA']
            );
        });

        describe('with fields', () => {
            describe('TEXT', () => {
                it('without options', () => {
                    assert.deepEqual(
                        transformArguments('index', {
                            field: SchemaFieldTypes.TEXT
                        }),
                        ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TEXT']
                    );
                });

                it('with NOSTEM', () => {
                    assert.deepEqual(
                        transformArguments('index', {
                            field: {
                                type: SchemaFieldTypes.TEXT,
                                NOSTEM: true
                            }
                        }),
                        ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TEXT', 'NOSTEM']
                    );
                });

                it('with WEIGHT', () => {
                    assert.deepEqual(
                        transformArguments('index', {
                            field: {
                                type: SchemaFieldTypes.TEXT,
                                WEIGHT: 1
                            }
                        }),
                        ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TEXT', 'WEIGHT', '1']
                    );
                });

                it('with PHONETIC', () => {
                    assert.deepEqual(
                        transformArguments('index', {
                            field: {
                                type: SchemaFieldTypes.TEXT,
                                PHONETIC: SchemaTextFieldPhonetics.DM_EN
                            }
                        }),
                        ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TEXT', 'PHONETIC', SchemaTextFieldPhonetics.DM_EN]
                    );
                });
            });

            it('NUMERIC', () => {
                assert.deepEqual(
                    transformArguments('index', {
                        field: SchemaFieldTypes.NUMERIC
                    }),
                    ['FT.CREATE', 'index', 'SCHEMA', 'field', 'NUMERIC']
                );
            });

            it('GEO', () => {
                assert.deepEqual(
                    transformArguments('index', {
                        field: SchemaFieldTypes.GEO
                    }),
                    ['FT.CREATE', 'index', 'SCHEMA', 'field', 'GEO']
                );
            });

            describe('TAG', () => {
                describe('without options', () => {
                    it('SchemaFieldTypes.TAG', () => {
                        assert.deepEqual(
                            transformArguments('index', {
                                field: SchemaFieldTypes.TAG
                            }),
                            ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TAG']
                        );
                    });

                    it('{ type: SchemaFieldTypes.TAG }', () => {
                        assert.deepEqual(
                            transformArguments('index', {
                                field: {
                                    type: SchemaFieldTypes.TAG
                                }
                            }),
                            ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TAG']
                        );
                    });
                });

                it('with SEPERATOR', () => {
                    assert.deepEqual(
                        transformArguments('index', {
                            field: {
                                type: SchemaFieldTypes.TAG,
                                SEPERATOR: 'seperator'
                            }
                        }),
                        ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TAG', 'SEPERATOR', 'seperator']
                    );
                });



                it('with CASESENSITIVE', () => {
                    assert.deepEqual(
                        transformArguments('index', {
                            field: {
                                type: SchemaFieldTypes.TAG,
                                CASESENSITIVE: true
                            }
                        }),
                        ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TAG', 'CASESENSITIVE']
                    );
                });
            });

            describe('with generic options', () => {
                it('with AS', () => {
                    assert.deepEqual(
                        transformArguments('index', {
                            field: {
                                type: SchemaFieldTypes.TEXT,
                                AS: 'as'
                            }
                        }),
                        ['FT.CREATE', 'index', 'SCHEMA', 'field', 'AS', 'as', 'TEXT']
                    );
                });

                describe('with SORTABLE', () => {
                    it('true', () => {
                        assert.deepEqual(
                            transformArguments('index', {
                                field: {
                                    type: SchemaFieldTypes.TEXT,
                                    SORTABLE: true
                                }
                            }),
                            ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TEXT', 'SORTABLE']
                        );
                    });

                    it('UNF', () => {
                        assert.deepEqual(
                            transformArguments('index', {
                                field: {
                                    type: SchemaFieldTypes.TEXT,
                                    SORTABLE: 'UNF'
                                }
                            }),
                            ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TEXT', 'SORTABLE', 'UNF']
                        );
                    });
                });

                it('with NOINDEX', () => {
                    assert.deepEqual(
                        transformArguments('index', {
                            field: {
                                type: SchemaFieldTypes.TEXT,
                                NOINDEX: true
                            }
                        }),
                        ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TEXT', 'NOINDEX']
                    );
                });
            });
        });

        it('with ON', () => {
            assert.deepEqual(
                transformArguments('index', {}, {
                    ON: 'HASH'
                }),
                ['FT.CREATE', 'index', 'ON', 'HASH', 'SCHEMA']
            );
        });

        describe('with PREFIX', () => {
            it('string', () => {
                assert.deepEqual(
                    transformArguments('index', {}, {
                        PREFIX: 'prefix'
                    }),
                    ['FT.CREATE', 'index', 'PREFIX', '1', 'prefix', 'SCHEMA']
                );
            });

            it('Array', () => {
                assert.deepEqual(
                    transformArguments('index', {}, {
                        PREFIX: ['1', '2']
                    }),
                    ['FT.CREATE', 'index', 'PREFIX', '2', '1', '2', 'SCHEMA']
                );
            });
        });

        it('with FILTER', () => {
            assert.deepEqual(
                transformArguments('index', {}, {
                    FILTER: '@field != ""'
                }),
                ['FT.CREATE', 'index', 'FILTER', '@field != ""', 'SCHEMA']
            );
        });

        it('with LANGUAGE', () => {
            assert.deepEqual(
                transformArguments('index', {}, {
                    LANGUAGE: RedisSearchLanguages.ARABIC
                }),
                ['FT.CREATE', 'index', 'LANGUAGE', RedisSearchLanguages.ARABIC, 'SCHEMA']
            );
        });

        it('with LANGUAGE_FIELD', () => {
            assert.deepEqual(
                transformArguments('index', {}, {
                    LANGUAGE_FIELD: '@field'
                }),
                ['FT.CREATE', 'index', 'LANGUAGE_FIELD', '@field', 'SCHEMA']
            );
        });

        it('with SCORE', () => {
            assert.deepEqual(
                transformArguments('index', {}, {
                    SCORE: 1
                }),
                ['FT.CREATE', 'index', 'SCORE', '1', 'SCHEMA']
            );
        });

        it('with SCORE_FIELD', () => {
            assert.deepEqual(
                transformArguments('index', {}, {
                    SCORE_FIELD: '@field'
                }),
                ['FT.CREATE', 'index', 'SCORE_FIELD', '@field', 'SCHEMA']
            );
        });

        it('with MAXTEXTFIELDS', () => {
            assert.deepEqual(
                transformArguments('index', {}, {
                    MAXTEXTFIELDS: true
                }),
                ['FT.CREATE', 'index', 'MAXTEXTFIELDS', 'SCHEMA']
            );
        });

        it('with TEMPORARY', () => {
            assert.deepEqual(
                transformArguments('index', {}, {
                    TEMPORARY: 1
                }),
                ['FT.CREATE', 'index', 'TEMPORARY', '1', 'SCHEMA']
            );
        });

        it('with NOOFFSETS', () => {
            assert.deepEqual(
                transformArguments('index', {}, {
                    NOOFFSETS: true
                }),
                ['FT.CREATE', 'index', 'NOOFFSETS', 'SCHEMA']
            );
        });

        it('with NOHL', () => {
            assert.deepEqual(
                transformArguments('index', {}, {
                    NOHL: true
                }),
                ['FT.CREATE', 'index', 'NOHL', 'SCHEMA']
            );
        });

        it('with NOFIELDS', () => {
            assert.deepEqual(
                transformArguments('index', {}, {
                    NOFIELDS: true
                }),
                ['FT.CREATE', 'index', 'NOFIELDS', 'SCHEMA']
            );
        });

        it('with NOFREQS', () => {
            assert.deepEqual(
                transformArguments('index', {}, {
                    NOFREQS: true
                }),
                ['FT.CREATE', 'index', 'NOFREQS', 'SCHEMA']
            );
        });

        it('with SKIPINITIALSCAN', () => {
            assert.deepEqual(
                transformArguments('index', {}, {
                    SKIPINITIALSCAN: true
                }),
                ['FT.CREATE', 'index', 'SKIPINITIALSCAN', 'SCHEMA']
            );
        });

        describe('with STOPWORDS', () => {
            it('string', () => {
                assert.deepEqual(
                    transformArguments('index', {}, {
                        STOPWORDS: 'stopword'
                    }),
                    ['FT.CREATE', 'index', 'STOPWORDS', '1', 'stopword', 'SCHEMA']
                );
            });

            it('Array', () => {
                assert.deepEqual(
                    transformArguments('index', {}, {
                        STOPWORDS: ['1', '2']
                    }),
                    ['FT.CREATE', 'index', 'STOPWORDS', '2', '1', '2', 'SCHEMA']
                );
            });
        });
    });

    testUtils.testWithClient('client.ft.create', async client => {
        assert.equal(
            await client.ft.create('index', {
                field: SchemaFieldTypes.TEXT // TODO: shouldn't be mandatory
            }),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});

import { strict as assert } from 'assert';
import { RedisSearchLanguages, SchemaFieldTypes } from '.';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SEARCH';

describe('SEARCH', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('index', 'query'),
                ['FT.SEARCH', 'index', 'query']
            );
        });

        it('with VERBATIM', () => {
            assert.deepEqual(
                transformArguments('index', 'query', { VERBATIM: true }),
                ['FT.SEARCH', 'index', 'query', 'VERBATIM']
            );
        });

        it('with NOSTOPWORDS', () => {
            assert.deepEqual(
                transformArguments('index', 'query', { NOSTOPWORDS: true }),
                ['FT.SEARCH', 'index', 'query', 'NOSTOPWORDS']
            );
        });

        it('with INKEYS', () => {
            assert.deepEqual(
                transformArguments('index', 'query', { INKEYS: 'key' }),
                ['FT.SEARCH', 'index', 'query', 'INKEYS', '1', 'key']
            );
        });

        it('with INFIELDS', () => {
            assert.deepEqual(
                transformArguments('index', 'query', { INFIELDS: 'field' }),
                ['FT.SEARCH', 'index', 'query', 'INFIELDS', '1', 'field']
            );
        });

        it('with RETURN', () => {
            assert.deepEqual(
                transformArguments('index', 'query', { RETURN: 'return' }),
                ['FT.SEARCH', 'index', 'query', 'RETURN', '1', 'return']
            );
        });

        describe('with SUMMARIZE', () => {
            it('true', () => {
                assert.deepEqual(
                    transformArguments('index', 'query', { SUMMARIZE: true }),
                    ['FT.SEARCH', 'index', 'query', 'SUMMARIZE']
                );
            });

            describe('with FIELDS', () => {
                it('string', () => {
                    assert.deepEqual(
                        transformArguments('index', 'query', {
                            SUMMARIZE: {
                                FIELDS: ['@field']
                            }
                        }),
                        ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'FIELDS', '1', '@field']
                    );
                });

                it('Array', () => {
                    assert.deepEqual(
                        transformArguments('index', 'query', {
                            SUMMARIZE: {
                                FIELDS: ['@1', '@2']
                            }
                        }),
                        ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'FIELDS', '2', '@1', '@2']
                    );
                });
            });

            it('with FRAGS', () => {
                assert.deepEqual(
                    transformArguments('index', 'query', {
                        SUMMARIZE: {
                            FRAGS: 1
                        }
                    }),
                    ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'FRAGS', '1']
                );
            });

            it('with LEN', () => {
                assert.deepEqual(
                    transformArguments('index', 'query', {
                        SUMMARIZE: {
                            LEN: 1
                        }
                    }),
                    ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'LEN', '1']
                );
            });

            it('with SEPARATOR', () => {
                assert.deepEqual(
                    transformArguments('index', 'query', {
                        SUMMARIZE: {
                            SEPARATOR: 'separator'
                        }
                    }),
                    ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'SEPARATOR', 'separator']
                );
            });
        });

        describe('with HIGHLIGHT', () => {
            it('true', () => {
                assert.deepEqual(
                    transformArguments('index', 'query', { HIGHLIGHT: true }),
                    ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT']
                );
            });

            describe('with FIELDS', () => {
                it('string', () => {
                    assert.deepEqual(
                        transformArguments('index', 'query', {
                            HIGHLIGHT: {
                                FIELDS: ['@field']
                            }
                        }),
                        ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'FIELDS', '1', '@field']
                    );
                });

                it('Array', () => {
                    assert.deepEqual(
                        transformArguments('index', 'query', {
                            HIGHLIGHT: {
                                FIELDS: ['@1', '@2']
                            }
                        }),
                        ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'FIELDS', '2', '@1', '@2']
                    );
                });
            });

            it('with TAGS', () => {
                assert.deepEqual(
                    transformArguments('index', 'query', {
                        HIGHLIGHT: {
                            TAGS: {
                                open: 'open',
                                close: 'close'
                            }
                        }
                    }),
                    ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'TAGS', 'open', 'close']
                );
            });
        });

        it('with SLOP', () => {
            assert.deepEqual(
                transformArguments('index', 'query', { SLOP: 1 }),
                ['FT.SEARCH', 'index', 'query', 'SLOP', '1']
            );
        });

        it('with INORDER', () => {
            assert.deepEqual(
                transformArguments('index', 'query', { INORDER: true }),
                ['FT.SEARCH', 'index', 'query', 'INORDER']
            );
        });

        it('with LANGUAGE', () => {
            assert.deepEqual(
                transformArguments('index', 'query', { LANGUAGE: RedisSearchLanguages.ARABIC }),
                ['FT.SEARCH', 'index', 'query', 'LANGUAGE', RedisSearchLanguages.ARABIC]
            );
        });

        it('with EXPANDER', () => {
            assert.deepEqual(
                transformArguments('index', 'query', { EXPANDER: 'expender' }),
                ['FT.SEARCH', 'index', 'query', 'EXPANDER', 'expender']
            );
        });

        it('with SCORER', () => {
            assert.deepEqual(
                transformArguments('index', 'query', { SCORER: 'scorer' }),
                ['FT.SEARCH', 'index', 'query', 'SCORER', 'scorer']
            );
        });

        it('with SORTBY', () => {
            assert.deepEqual(
                transformArguments('index', 'query', { SORTBY: '@by' }),
                ['FT.SEARCH', 'index', 'query', 'SORTBY', '@by']
            );
        });

        it('with LIMIT', () => {
            assert.deepEqual(
                transformArguments('index', 'query', {
                    LIMIT: {
                        from: 0,
                        size: 1
                    }
                }),
                ['FT.SEARCH', 'index', 'query', 'LIMIT', '0', '1']
            );
        });

        it('with PARAMS', () => {
            assert.deepEqual(
                transformArguments('index', 'query', {
                    PARAMS: {
                        param: 'value'
                    }
                }),
                ['FT.SEARCH', 'index', 'query', 'PARAMS', '2', 'param', 'value']
            );
        });

        it('with DIALECT', () => {
            assert.deepEqual(
                transformArguments('index', 'query', {
                    DIALECT: 1
                }),
                ['FT.SEARCH', 'index', 'query', 'DIALECT', '1']
            );
        });
    });

    describe('client.ft.search', () => {
        testUtils.testWithClient('DIALECT 1', async client => {
            await Promise.all([
                client.ft.create('index', {
                    field: SchemaFieldTypes.NUMERIC
                }),
                client.hSet('1', 'field', '1')
            ]);

            assert.deepEqual(
                await client.ft.search('index', '*', {
                    DIALECT: 1
                }),
                {
                    total: 1,
                    documents: [{
                        id: '1',
                        value: Object.create(null, {
                            field: {
                                value: '1',
                                configurable: true,
                                enumerable: true
                            }
                        })
                    }]
                }
            );
        }, GLOBAL.SERVERS.OPEN);

        testUtils.testWithClient('DIALECT 2', async client => {
            await Promise.all([
                client.ft.create('index', {
                    field: SchemaFieldTypes.NUMERIC
                }),
                client.hSet('1', 'field', '1'),
                client.hSet('2', 'field', '2'),
                client.hSet('3', 'field', '3')
            ]);

            assert.deepEqual(
                await client.ft.search('index', '@field:[$min $max]', {
                    PARAMS: {
                        min: 1,
                        max: 2
                    },
                    DIALECT: 2
                }),
                {
                    total: 2,
                    documents: [{
                        id: '1',
                        value: Object.create(null, {
                            field: {
                                value: '1',
                                configurable: true,
                                enumerable: true
                            }
                        })
                    }, {
                        id: '2',
                        value: Object.create(null, {
                            field: {
                                value: '2',
                                configurable: true,
                                enumerable: true
                            }
                        })
                    }]
                }
            );
        }, GLOBAL.SERVERS.OPEN);
    });
});

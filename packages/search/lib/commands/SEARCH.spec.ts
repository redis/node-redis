import { strict as assert } from 'assert';
import { RedisSearchLanguages } from '.';
import testUtils, { GLOBAL } from '../test-utils';
import { SchemaFieldTypes } from './CREATE';
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

        it('with MSORTBY', () => {
            assert.deepEqual(
                transformArguments('index', 'query', { MSORTBY: '@by' }),
                ['FT.SEARCH', 'index', 'query', 'MSORTBY', '1', '@by']
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
    });

    testUtils.testWithClient('client.ft.search', async client => {
        await Promise.all([
            client.ft.create('index', {
                field: SchemaFieldTypes.NUMERIC
            }),
            client.hSet('1', 'field', '1')
        ]);

        assert.deepEqual(
            await client.ft.search('index', '*'),
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
});

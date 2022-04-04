import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { SchemaFieldTypes } from '.';
import { transformArguments } from './SPELLCHECK';

describe('SPELLCHECK', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('index', 'query'),
                ['FT.SPELLCHECK', 'index', 'query']
            );
        });

        it('with DISTANCE', () => {
            assert.deepEqual(
                transformArguments('index', 'query', { DISTANCE: 2 }),
                ['FT.SPELLCHECK', 'index', 'query', 'DISTANCE', '2']
            );
        });

        describe('with TERMS', () => {
            it('single', () => {
                assert.deepEqual(
                    transformArguments('index', 'query', {
                        TERMS: {
                            mode: 'INCLUDE',
                            dictionary: 'dictionary'
                        }
                    }),
                    ['FT.SPELLCHECK', 'index', 'query', 'TERMS', 'INCLUDE', 'dictionary']
                );
            });

            it('multiple', () => {
                assert.deepEqual(
                    transformArguments('index', 'query', {
                        TERMS: [{
                            mode: 'INCLUDE',
                            dictionary: 'include'
                        }, {
                            mode: 'EXCLUDE',
                            dictionary: 'exclude'
                        }]
                    }),
                    ['FT.SPELLCHECK', 'index', 'query', 'TERMS', 'INCLUDE', 'include', 'TERMS', 'EXCLUDE', 'exclude']
                );
            });
        });

        it('with DIALECT', () => {
            assert.deepEqual(
                transformArguments('index', 'query', {
                    DIALECT: 1
                }),
                ['FT.SPELLCHECK', 'index', 'query', 'DIALECT', '1']
            );
        });
    });

    testUtils.testWithClient('client.ft.spellCheck', async client => {
        await Promise.all([
            client.ft.create('index', {
                field: SchemaFieldTypes.TEXT
            }),
            client.hSet('key', 'field', 'query')
        ]);

        assert.deepEqual(
            await client.ft.spellCheck('index', 'quer'),
            [{
                term: 'quer',
                suggestions: [{
                    score: 1,
                    suggestion: 'query'
                }]
            }]
        );
    }, GLOBAL.SERVERS.OPEN);
});

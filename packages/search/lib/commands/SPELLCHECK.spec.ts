import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SPELLCHECK from './SPELLCHECK';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import { DEFAULT_DIALECT } from '../dialect/default';

describe('FT.SPELLCHECK', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(SPELLCHECK, 'index', 'query'),
        ['FT.SPELLCHECK', 'index', 'query', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with DISTANCE', () => {
      assert.deepEqual(
        parseArgs(SPELLCHECK, 'index', 'query', {
          DISTANCE: 2
        }),
        ['FT.SPELLCHECK', 'index', 'query', 'DISTANCE', '2', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    describe('with TERMS', () => {
      it('single', () => {
        assert.deepEqual(
          parseArgs(SPELLCHECK, 'index', 'query', {
            TERMS: {
              mode: 'INCLUDE',
              dictionary: 'dictionary'
            }
          }),
          ['FT.SPELLCHECK', 'index', 'query', 'TERMS', 'INCLUDE', 'dictionary', 'DIALECT', DEFAULT_DIALECT]
        );
      });

      it('multiple', () => {
        assert.deepEqual(
          parseArgs(SPELLCHECK, 'index', 'query', {
            TERMS: [{
              mode: 'INCLUDE',
              dictionary: 'include'
            }, {
              mode: 'EXCLUDE',
              dictionary: 'exclude'
            }]
          }),
          ['FT.SPELLCHECK', 'index', 'query', 'TERMS', 'INCLUDE', 'include', 'TERMS', 'EXCLUDE', 'exclude', 'DIALECT', DEFAULT_DIALECT]
        );
      });
    });

    it('with DIALECT', () => {
      assert.deepEqual(
        parseArgs(SPELLCHECK, 'index', 'query', {
          DIALECT: 1
        }),
        ['FT.SPELLCHECK', 'index', 'query', 'DIALECT', '1']
      );
    });
  });

  testUtils.testWithClient('client.ft.spellCheck', async client => {
    const [,, reply] = await Promise.all([
      client.ft.create('index', {
        field: 'TEXT'
      }),
      client.hSet('key', 'field', 'query'),
      client.ft.spellCheck('index', 'quer')
    ]);

    assert.deepEqual(reply, [{
      term: 'quer',
      suggestions: [{
        score: 1,
        suggestion: 'query'
      }]
    }]);
  }, GLOBAL.SERVERS.OPEN);
});

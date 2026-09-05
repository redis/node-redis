import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import SEARCH_NOCONTENT from './SEARCH_NOCONTENT';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import { DEFAULT_DIALECT } from '../dialect/default';

describe('FT.SEARCH NOCONTENT', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(SEARCH_NOCONTENT, 'index', 'query'),
        ['FT.SEARCH', 'index', 'query', 'DIALECT', DEFAULT_DIALECT, 'NOCONTENT']
      );
    });
    it('with a permitted option (FILTER)', () => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH_NOCONTENT, 'index', 'query', {
          FILTER: { field: 'price', min: 10, max: 100 }
        })),
        ['FT.SEARCH', 'index', 'query', 'FILTER', 'price', '10', '100', 'DIALECT', DEFAULT_DIALECT, 'NOCONTENT']
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH_NOCONTENT, 'index', 'query', {
          LIMIT: { from: 0, size: 5 }
        })),
        ['FT.SEARCH', 'index', 'query', 'LIMIT', '0', '5', 'DIALECT', DEFAULT_DIALECT, 'NOCONTENT']
      );
    });

    it('with SORTBY', () => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH_NOCONTENT, 'index', 'query', {
          SORTBY: { BY: '@field', DIRECTION: 'DESC' }
        })),
        ['FT.SEARCH', 'index', 'query', 'SORTBY', '@field', 'DESC', 'DIALECT', DEFAULT_DIALECT, 'NOCONTENT']
      );
    });
  });

  describe('client.ft.searchNoContent', () => {
    testUtils.testWithClient('returns total and keys', async client => {
      await Promise.all([
        client.ft.create('index', {
          field: 'TEXT'
        }),
        client.hSet('1', 'field', 'field1'),
        client.hSet('2', 'field', 'field2')
      ]);

      assert.deepEqual(
        await client.ft.searchNoContent('index', '*'),
        {
          total: 2,
          documents: ['1', '2'],
          warnings: []
        }
      );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('returns structured reply', async client => {
      await Promise.all([
        client.ft.create('index', {
          field: 'TEXT'
        }),
        client.hSet('1', 'field', 'field1'),
        client.hSet('2', 'field', 'field2')
      ]);

      const reply = await client.ft.searchNoContent('index', '*');

      // Transformed reply has { total, documents }
      assert.ok(reply !== null && typeof reply === 'object');
      assert.equal(typeof reply.total, 'number');
      assert.equal(reply.total, 2);
      assert.ok(Array.isArray(reply.documents));
      assert.equal(reply.documents.length, 2);
    }, GLOBAL.SERVERS.OPEN);
  
    testUtils.testWithClient('documents are plain string IDs, not objects', async client => {
      await Promise.all([
        client.ft.create('index', { field: 'TEXT' }),
        client.hSet('1', 'field', 'hello world')
      ]);
      const reply = await client.ft.searchNoContent('index', '*');
      assert.strictEqual(typeof reply.documents[0], 'string');
      assert.strictEqual(reply.documents[0], '1');
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('respects FILTER', async client => {
      await Promise.all([
        client.ft.create('index', { price: { type: 'NUMERIC' } }),
        client.hSet('doc:1', 'price', '15'),
        client.hSet('doc:2', 'price', '50'),
        client.hSet('doc:3', 'price', '120')
      ]);
      const reply = await client.ft.searchNoContent('index', '*', {
        FILTER: { field: 'price', min: 10, max: 100 }
      });
      assert.strictEqual(reply.total, 2);
      assert.deepStrictEqual(reply.documents.sort(), ['doc:1', 'doc:2']);
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('respects LIMIT', async client => {
      await Promise.all([
        client.ft.create('index', { field: 'TEXT' }),
        client.hSet('1', 'field', 'hello'),
        client.hSet('2', 'field', 'hello'),
        client.hSet('3', 'field', 'hello')
      ]);
      const reply = await client.ft.searchNoContent('index', '*', {
        LIMIT: { from: 0, size: 1 }
      });
      assert.strictEqual(reply.total, 3, 'total reflects all matches, not just the page');
      assert.strictEqual(reply.documents.length, 1);
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('empty index returns empty documents, not an error', async client => {
      await client.ft.create('index', { field: 'TEXT' });
      const reply = await client.ft.searchNoContent('index', '*');
      assert.strictEqual(reply.total, 0);
      assert.deepStrictEqual(reply.documents, []);
      assert.deepStrictEqual(reply.warnings, []);
    }, GLOBAL.SERVERS.OPEN);
  });
});
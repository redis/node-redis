import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { RESP_TYPES } from '../RESP/decoder';
import COMMAND_DOCS from './COMMAND_DOCS';
import { parseArgs } from './generic-transformers';

describe('COMMAND DOCS', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(COMMAND_DOCS),
        ['COMMAND', 'DOCS']
      );
    });

    it('string', () => {
      assert.deepEqual(
        parseArgs(COMMAND_DOCS, 'GET'),
        ['COMMAND', 'DOCS', 'GET']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(COMMAND_DOCS, ['GET', 'SET']),
        ['COMMAND', 'DOCS', 'GET', 'SET']
      );
    });
  });

  describe('transformReply', () => {
    it('RESP2 map with nested arguments', () => {
      assert.deepEqual(
        COMMAND_DOCS.transformReply[2]([
          'get',
          [
            'summary', 'Get the value of a key',
            'since', '1.0.0',
            'group', 'string',
            'complexity', 'O(1)',
            'history', [['2.2.3', 'Added MSET']],
            'arguments', [
              [
                'name', 'key',
                'type', 'key',
                'display_text', 'key',
                'key_spec_index', 0
              ]
            ]
          ],
          'command',
          [
            'summary', 'Get or set information about commands',
            'since', '2.8.13',
            'group', 'server',
            'complexity', 'O(N)',
            'subcommands', [
              'command|docs',
              [
                'summary', 'Returns documentary information about commands',
                'since', '7.0.0',
                'group', 'server',
                'complexity', 'O(N)'
              ]
            ]
          ]
        ] as never),
        {
          get: {
            summary: 'Get the value of a key',
            since: '1.0.0',
            group: 'string',
            complexity: 'O(1)',
            history: [['2.2.3', 'Added MSET']],
            arguments: [{
              name: 'key',
              type: 'key',
              display_text: 'key',
              key_spec_index: 0
            }]
          },
          command: {
            summary: 'Get or set information about commands',
            since: '2.8.13',
            group: 'server',
            complexity: 'O(N)',
            subcommands: {
              'command|docs': {
                summary: 'Returns documentary information about commands',
                since: '7.0.0',
                group: 'server',
                complexity: 'O(N)'
              }
            }
          }
        }
      );
    });
  });

  testUtils.testWithClient('client.commandDocs', async client => {
    const docs = await client.commandDocs();
    assert.equal(typeof docs, 'object');
    assert.ok(docs !== null);
    assert.ok(!Array.isArray(docs));

    const get = docs['get'];
    assert.ok(get);
    assert.equal(typeof get.summary, 'string');
    assert.equal(typeof get.since, 'string');
    assert.equal(typeof get.group, 'string');
    assert.equal(typeof get.complexity, 'string');
    assert.ok(Array.isArray(get.arguments));
    assert.ok(get.arguments!.length > 0);
    assert.equal(typeof get.arguments![0].name, 'string');
    assert.equal(typeof get.arguments![0].type, 'string');
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [7]
  });

  testUtils.testWithClient('client.commandDocs with RESP2 and Map type mapping', async client => {
    const docs = await client
      .withTypeMapping({ [RESP_TYPES.MAP]: Map })
      .commandDocs('GET');

    assert.ok(docs instanceof Map);
    const get = docs.get('get');
    assert.ok(get instanceof Map);

    const argumentsReply = get.get('arguments');
    assert.ok(Array.isArray(argumentsReply));
    assert.ok(argumentsReply[0] instanceof Map);
    assert.equal(argumentsReply[0].get('name'), 'key');
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 2
    },
    minimumDockerVersion: [7]
  });

  testUtils.testWithClient('client.commandDocs with command filter', async client => {
    const docs = await client.commandDocs(['GET', 'SET']);
    assert.ok('get' in docs);
    assert.ok('set' in docs);
    assert.equal(Object.keys(docs).length, 2);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [7]
  });
});

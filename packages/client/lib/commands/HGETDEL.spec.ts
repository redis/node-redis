import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { BasicCommandParser } from '../client/parser';
import HGETDEL from './HGETDEL';

describe('HGETDEL parseCommand', () => {
    it('hGetDel parseCommand base', () => {
        const parser = new BasicCommandParser;
        HGETDEL.parseCommand(parser, 'key', 'field');
        assert.deepEqual(parser.redisArgs, ['HGETDEL', 'key', 'FIELDS', '1', 'field']);
    });

    it('hGetDel parseCommand variadic', () => {
        const parser = new BasicCommandParser;
        HGETDEL.parseCommand(parser, 'key', ['field1', 'field2']);
        assert.deepEqual(parser.redisArgs, ['HGETDEL', 'key', 'FIELDS', '2', 'field1', 'field2']);
    });
});


describe('HGETDEL call', () => {
  testUtils.testWithClientIfVersionWithinRange([[8], 'LATEST'], 'hGetDel empty single field', async client => {
    assert.deepEqual(
        await client.hGetDel('key', 'filed1'),
        [null]
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8], 'LATEST'], 'hGetDel empty multiple fields', async client => {
    assert.deepEqual(
        await client.hGetDel('key', ['filed1', 'field2']),
        [null, null]
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8], 'LATEST'], 'hGetDel partially populated multiple fields', async client => {
    await client.hSet('key', 'field1', 'value1')
    assert.deepEqual(
        await client.hGetDel('key', ['field1', 'field2']),
        ['value1', null]
    );
    
    assert.deepEqual(
        await client.hGetDel('key', 'field1'),
        [null]
    );
  }, GLOBAL.SERVERS.OPEN);
});

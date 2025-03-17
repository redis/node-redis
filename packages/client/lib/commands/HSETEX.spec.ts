import { strict as assert } from 'node:assert';
import testUtils,{ GLOBAL } from '../test-utils';
import { BasicCommandParser } from '../client/parser';
import HSETEX from './HSETEX';

describe('HSETEX parseCommand', () => {
  it('hSetEx parseCommand base', () => {
    const parser = new BasicCommandParser;
    HSETEX.parseCommand(parser, 'key', ['field', 'value']);
    assert.deepEqual(parser.redisArgs, ['HSETEX', 'key', 'FIELDS', '1', 'field', 'value']);
  });

  it('hSetEx parseCommand base empty obj', () => {
    const parser = new BasicCommandParser;
    assert.throws(() => {HSETEX.parseCommand(parser, 'key', {})});
  });

  it('hSetEx parseCommand base one key obj', () => {
    const parser = new BasicCommandParser;
    HSETEX.parseCommand(parser, 'key', {'k': 'v'});
    assert.deepEqual(parser.redisArgs, ['HSETEX', 'key', 'FIELDS', '1', 'k', 'v']);
  });

  it('hSetEx parseCommand array', () => {
    const parser = new BasicCommandParser;
    HSETEX.parseCommand(parser, 'key', ['field1', 'value1', 'field2', 'value2']);
    assert.deepEqual(parser.redisArgs, ['HSETEX', 'key', 'FIELDS', '2', 'field1', 'value1', 'field2', 'value2']);
  });

  it('hSetEx parseCommand array invalid args, throws an error', () => {
    const parser = new BasicCommandParser;
    assert.throws(() => {HSETEX.parseCommand(parser, 'key', ['field1', 'value1', 'field2'])});
  });

  it('hSetEx parseCommand array in array', () => {
    const parser1 = new BasicCommandParser;
    HSETEX.parseCommand(parser1, 'key', [['field1', 'value1'], ['field2', 'value2']]);
    assert.deepEqual(parser1.redisArgs, ['HSETEX', 'key', 'FIELDS', '2', 'field1', 'value1', 'field2', 'value2']);

    const parser2 = new BasicCommandParser;
    HSETEX.parseCommand(parser2, 'key', [['field1', 'value1'], ['field2', 'value2'], ['field3', 'value3']]);
    assert.deepEqual(parser2.redisArgs, ['HSETEX', 'key', 'FIELDS', '3', 'field1', 'value1', 'field2', 'value2', 'field3', 'value3']);
  });
  
  it('hSetEx parseCommand map', () => {
    const parser1 = new BasicCommandParser;
    HSETEX.parseCommand(parser1, 'key', new Map([['field1', 'value1'], ['field2', 'value2']]));
    assert.deepEqual(parser1.redisArgs, ['HSETEX', 'key', 'FIELDS', '2', 'field1', 'value1', 'field2', 'value2']);
  });

  it('hSetEx parseCommand obj', () => {
    const parser1 = new BasicCommandParser;
    HSETEX.parseCommand(parser1, 'key', {field1: "value1", field2: "value2"});
    assert.deepEqual(parser1.redisArgs, ['HSETEX', 'key', 'FIELDS', '2', 'field1', 'value1', 'field2', 'value2']);
  });

  it('hSetEx parseCommand options FNX KEEPTTL', () => {
    const parser = new BasicCommandParser;
    HSETEX.parseCommand(parser, 'key', ['field', 'value'], {mode: 'FNX', expiration: 'KEEPTTL'});
    assert.deepEqual(parser.redisArgs, ['HSETEX', 'key', 'FNX', 'KEEPTTL', 'FIELDS', '1', 'field', 'value']);
  });

  it('hSetEx parseCommand options FXX EX 500', () => {
    const parser = new BasicCommandParser;
    HSETEX.parseCommand(parser, 'key', ['field', 'value'], {mode: 'FXX', expiration: {type: 'EX', value: 500}});
    assert.deepEqual(parser.redisArgs, ['HSETEX', 'key', 'FXX', 'EX', '500', 'FIELDS', '1', 'field', 'value']);
  });
});


describe('HSETEX call', () => {
    testUtils.testWithClientIfVersionWithinRange([[8], 'LATEST'], 'hSetEx calls', async client => {
      assert.deepEqual(
        await client.hSetEx('key_hsetex_call',  ['field1', 'value1'], {expiration: {type: "EX", value: 500}, mode: "FNX"}),
        1
      );

      assert.deepEqual(
        await client.hSetEx('key_hsetex_call', ['field1', 'value1', 'field2', 'value2'], {expiration: {type: "EX", value: 500}, mode: "FXX"}),
        0
      );

      assert.deepEqual(
        await client.hSetEx('key_hsetex_call', ['field1', 'value1', 'field2', 'value2'], {expiration: {type: "EX", value: 500}, mode: "FNX"}),
        0
      );

      assert.deepEqual(
        await client.hSetEx('key_hsetex_call', ['field2', 'value2'], {expiration: {type: "EX", value: 500}, mode: "FNX"}),
        1
      );

      assert.deepEqual(
        await client.hSetEx('key_hsetex_call', ['field1', 'value1', 'field2', 'value2'], {expiration: {type: "EX", value: 500}, mode: "FXX"}),
        1
      );
    }, GLOBAL.SERVERS.OPEN);
});
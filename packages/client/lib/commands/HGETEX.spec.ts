import { strict as assert } from 'node:assert';
import testUtils,{ GLOBAL } from '../test-utils';
import { BasicCommandParser } from '../client/parser';
import HGETEX from './HGETEX';
import { setTimeout } from 'timers/promises';

describe('HGETEX parseCommand', () => {
  it('hGetEx parseCommand base', () => {
    const parser = new BasicCommandParser;
    HGETEX.parseCommand(parser, 'key', 'field');
    assert.deepEqual(parser.redisArgs, ['HGETEX', 'key', 'FIELDS', '1', 'field']);
  });

  it('hGetEx parseCommand expiration PERSIST string', () => {
    const parser = new BasicCommandParser;
    HGETEX.parseCommand(parser, 'key', 'field', {expiration: 'PERSIST'});
    assert.deepEqual(parser.redisArgs, ['HGETEX', 'key', 'PERSIST', 'FIELDS', '1', 'field']);
  });

  it('hGetEx parseCommand expiration PERSIST obj', () => {
    const parser = new BasicCommandParser;
    HGETEX.parseCommand(parser, 'key', 'field', {expiration: {type: 'PERSIST'}});
    assert.deepEqual(parser.redisArgs, ['HGETEX', 'key', 'PERSIST', 'FIELDS', '1', 'field']);
  });

  it('hGetEx parseCommand expiration EX obj', () => {
    const parser = new BasicCommandParser;
    HGETEX.parseCommand(parser, 'key', 'field', {expiration: {type: 'EX', value: 1000}});
    assert.deepEqual(parser.redisArgs, ['HGETEX', 'key', 'EX', '1000', 'FIELDS', '1', 'field']);
  });

  it('hGetEx parseCommand expiration EXAT obj variadic', () => {
    const parser = new BasicCommandParser;
    HGETEX.parseCommand(parser, 'key', ['field1', 'field2'], {expiration: {type: 'EXAT', value: 1000}});
    assert.deepEqual(parser.redisArgs, ['HGETEX', 'key', 'EXAT', '1000', 'FIELDS', '2', 'field1', 'field2']);
  });
});


describe('HGETEX call', () => {
    testUtils.testWithClientIfVersionWithinRange([[8], 'LATEST'], 'hGetEx empty single field', async client => {
      assert.deepEqual(
        await client.hGetEx('key', 'field1', {expiration: 'PERSIST'}),
        [null]
      );
    }, GLOBAL.SERVERS.OPEN);
  
    testUtils.testWithClientIfVersionWithinRange([[8], 'LATEST'], 'hGetEx empty multiple fields', async client => {
      assert.deepEqual(
        await client.hGetEx('key', ['field1', 'field2'], {expiration: 'PERSIST'}),
        [null, null]
      );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClientIfVersionWithinRange([[8], 'LATEST'], 'hGetEx set expiry', async client => {
        await client.hSet('key', 'field', 'value')
        assert.deepEqual(
            await client.hGetEx('key', 'field', {expiration: {type: 'PX', value: 50}}),
            ['value']
        );
        await setTimeout(100)
        assert.deepEqual(
            await client.hGet('key', 'field'),
            null
        );  
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClientIfVersionWithinRange([[8], 'LATEST'], 'gGetEx set expiry PERSIST', async client => {
        await client.hSet('key', 'field', 'value')
        await client.hGetEx('key', 'field', {expiration: {type: 'PX', value: 50}})
        await client.hGetEx('key', 'field', {expiration: 'PERSIST'})
        await setTimeout(100)
        assert.deepEqual(
            await client.hGet('key', 'field'),
            'value'
        )
    }, GLOBAL.SERVERS.OPEN);
});
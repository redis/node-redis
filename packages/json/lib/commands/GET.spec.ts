import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GET from './GET';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.GET', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(GET, 'key'),
        ['JSON.GET', 'key']
      );
    });

    describe('with path', () => {
      it('string', () => {
        assert.deepEqual(
          parseArgs(GET, 'key', { path: '$' }),
          ['JSON.GET', 'key', '$']
        );
      });

      it('array', () => {
        assert.deepEqual(
          parseArgs(GET, 'key', { path: ['$.1', '$.2'] }),
          ['JSON.GET', 'key', '$.1', '$.2']
        );
      });
    });
  });

  testUtils.testWithClient('client.json.get', async client => {
    assert.equal(
      await client.json.get('key'),
      null
    );

    await client.json.set('noderedis:users:1', '$', { name: 'Alice', age: 32, })
    const res = await client.json.get('noderedis:users:1');
    assert.equal(typeof res, 'object')
    assert.deepEqual(res, { name: 'Alice', age: 32, })

  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.json.get with reviver', async client => {
    assert.equal(
      await client.json.get('key',{ reviver: ()=>{ assert.fail() } }),
      null
    );

    await client.json.set('noderedis:users:1', '$', { name: 'Alice', birthday: new Date('1998-02-12') });
    const res = await client.json.get('noderedis:users:1', { reviver: (key, value) => { if (key === 'birthday') return new Date(value); else return value; } });
    assert(typeof res === 'object' && res !== null && 'birthday' in res && res.birthday instanceof Date && res.birthday.getTime() === new Date('1998-02-12').getTime());

  }, GLOBAL.SERVERS.OPEN);
  
});

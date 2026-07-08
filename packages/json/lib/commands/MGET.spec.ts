import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MGET from './MGET';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.MGET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MGET, ['1', '2'], '$'),
      ['JSON.MGET', '1', '2', '$']
    );
  });

  testUtils.testWithClient('client.json.mGet', async client => {
    assert.deepEqual(
      await client.json.mGet(['1', '2'], '$'),
      [null, null]
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.json.mGet with reviver', async client => {
    await client.json.set('noderedis:users:1', '$', { name: 'Alice', birthday: new Date('1998-02-12') });
    await client.json.set('noderedis:users:2', '$', { name: 'Bob', birthday: new Date('1996-07-23') });
    const res = await client.json.mGet(['noderedis:users:1', 'noderedis:users:2'], '.', (key, value) => { if (key === 'birthday') return new Date(value); else return value; });
    assert(typeof res[0] === 'object' && res[0] !== null && 'birthday' in res[0] && (res[0].birthday instanceof Date) && res[0].birthday.getTime() === new Date('1998-02-12').getTime());
    assert(typeof res[1] === 'object' && res[1] !== null && 'birthday' in res[1] && res[1].birthday instanceof Date && res[1].birthday.getTime() === new Date('1996-07-23').getTime());

  }, GLOBAL.SERVERS.OPEN);
});

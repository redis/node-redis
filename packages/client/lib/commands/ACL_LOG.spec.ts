import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import ACL_LOG from './ACL_LOG';

describe('ACL LOG', () => {
  testUtils.isVersionGreaterThanHook([6]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        ACL_LOG.transformArguments(),
        ['ACL', 'LOG']
      );
    });

    it('with count', () => {
      assert.deepEqual(
        ACL_LOG.transformArguments(10),
        ['ACL', 'LOG', '10']
      );
    });
  });

  testUtils.testWithClient('client.aclLog', async client => {
    // make sure to create at least one log
    await Promise.all([
      client.aclSetUser('test', 'on >test'),
      client.auth({
        username: 'test',
        password: 'test'
      }),
      client.auth({
        username: 'default',
        password: ''
      })
    ]);

    const logs = await client.aclLog();
    assert.ok(Array.isArray(logs));
    for (const log of logs) {

      assert.equal(typeof log.count, 'number');
      assert.equal(typeof log.timestamp, 'number');
      assert.equal(typeof log.username, 'string');
      assert.equal(typeof log.clientId, 'string');
      assert.equal(typeof log.command, 'string');
      assert.equal(typeof log.args, 'string');
      assert.equal(typeof log.key, 'string');
      assert.equal(typeof log.result, 'number');
      assert.equal(typeof log.duration, 'number');
    }
  }, GLOBAL.SERVERS.OPEN);
});

import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ROLE from './ROLE';
import { parseArgs } from './generic-transformers';
import { RESP_TYPES } from '../RESP/decoder';

describe('ROLE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ROLE),
      ['ROLE']
    );
  });

  describe('transformReply', () => {
    it('master', () => {
      assert.deepEqual(
        ROLE.transformReply(['master', 3129659, [['127.0.0.1', '9001', '3129242'], ['127.0.0.1', '9002', '3129543']]] as any),
        {
          role: 'master',
          replicationOffest: 3129659,
          replicas: [{
            host: '127.0.0.1',
            port: 9001,
            replicationOffest: 3129242
          }, {
            host: '127.0.0.1',
            port: 9002,
            replicationOffest: 3129543
          }]
        }
      );
    });

    it('replica', () => {
      assert.deepEqual(
        ROLE.transformReply(['slave', '127.0.0.1', 9000, 'connected', 3167038] as any),
        {
          role: 'slave',
          master: {
            host: '127.0.0.1',
            port: 9000
          },
          state: 'connected',
          dataReceived: 3167038
        }
      );
    });

    it('sentinel', () => {
      assert.deepEqual(
        ROLE.transformReply(['sentinel', ['resque-master', 'html-fragments-master', 'stats-master', 'metadata-master']] as any),
        {
          role: 'sentinel',
          masterNames: ['resque-master', 'html-fragments-master', 'stats-master', 'metadata-master']
        }
      );
    });

    it('master with Buffer role from BLOB_STRING type mapping', () => {
      assert.deepEqual(
        ROLE.transformReply([Buffer.from('master'), 0, []] as any),
        {
          role: Buffer.from('master'),
          replicationOffest: 0,
          replicas: []
        }
      );
    });
  });

  testUtils.testWithClient('client.role', async client => {
    assert.deepEqual(
      await client.role(),
      {
        role: 'master',
        replicationOffest: 0,
        replicas: []
      }
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.role with BLOB_STRING Buffer mapping', async client => {
    const reply = await client.withTypeMapping({
      [RESP_TYPES.BLOB_STRING]: Buffer
    }).role();
    assert.ok(Buffer.isBuffer(reply.role));
    assert.equal(reply.role.toString(), 'master');
    assert.equal(reply.replicationOffest, 0);
    assert.deepEqual(reply.replicas, []);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.role with BLOB_STRING Buffer mapping (RESP2)', async client => {
    const reply = await client.withTypeMapping({
      [RESP_TYPES.BLOB_STRING]: Buffer
    }).role();
    assert.ok(Buffer.isBuffer(reply.role));
    assert.equal(reply.role.toString(), 'master');
    assert.equal(reply.replicationOffest, 0);
    assert.deepEqual(reply.replicas, []);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      ...GLOBAL.SERVERS.OPEN.clientOptions,
      RESP: 2
    }
  });
});

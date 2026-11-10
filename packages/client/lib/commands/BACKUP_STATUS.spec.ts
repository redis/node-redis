import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BACKUP_STATUS from './BACKUP_STATUS';
import { parseArgs } from './generic-transformers';

interface BackupClient {
  backupAbort(): Promise<unknown>;
  backupCleanup(): Promise<unknown>;
}

async function resetBackup(client: BackupClient) {
  await client.backupAbort().catch(() => {});
  await client.backupCleanup();
}

describe('BACKUP STATUS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(BACKUP_STATUS),
      ['BACKUP', 'STATUS']
    );
  });

  testUtils.testWithClient('client.backupStatus', async client => {
    await resetBackup(client);
    assert.deepEqual(
      await client.backupStatus(),
      {
        state: 'idle',
        error: '',
        start_time: 0,
        end_time: 0
      }
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });

  testUtils.testWithClient('client.backupStatus resp2', async client => {
    await resetBackup(client);
    assert.deepEqual(
      await client.backupStatus(),
      {
        state: 'idle',
        error: '',
        start_time: 0,
        end_time: 0
      }
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10],
    clientOptions: {
      RESP: 2
    }
  });
});

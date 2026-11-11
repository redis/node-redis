import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BACKUP_ABORT from './BACKUP_ABORT';
import { parseArgs } from './generic-transformers';

interface BackupClient {
  backupAbort(): Promise<unknown>;
  backupCleanup(): Promise<unknown>;
  backupStatus(): Promise<{ state: string }>;
}

async function resetBackup(client: BackupClient) {
  await client.backupAbort().catch(() => {});
  await client.backupCleanup();
}

async function waitForBackupState(client: BackupClient, state: string) {
  const deadline = Date.now() + 10_000;
  while ((await client.backupStatus()).state !== state) {
    if (Date.now() > deadline) throw new Error(`backup did not reach the ${state} state`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

describe('BACKUP ABORT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(BACKUP_ABORT),
      ['BACKUP', 'ABORT']
    );
  });

  testUtils.testWithClient('client.backupAbort', async client => {
    await resetBackup(client);
    try {
      await client.backupStart();
      await waitForBackupState(client, 'incrementing');
      assert.equal(await client.backupAbort(), 'OK');

      const status = await client.backupStatus();
      assert.equal(status.state, 'failed');
      assert.equal(status.error, 'aborted by user');
    } finally {
      await resetBackup(client);
    }
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });

  testUtils.testWithClient('client.backupAbort without a backup in progress', async client => {
    await resetBackup(client);
    await assert.rejects(client.backupAbort(), /No backup in progress/);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });
});

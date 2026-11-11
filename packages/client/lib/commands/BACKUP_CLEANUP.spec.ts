import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BACKUP_CLEANUP from './BACKUP_CLEANUP';
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

describe('BACKUP CLEANUP', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(BACKUP_CLEANUP),
      ['BACKUP', 'CLEANUP']
    );
  });

  testUtils.testWithClient('client.backupCleanup', async client => {
    await resetBackup(client);
    try {
      await client.backupStart();
      await waitForBackupState(client, 'incrementing');
      await client.backupSeal();
      assert.equal(await client.backupCleanup(), 'OK');
      assert.equal((await client.backupStatus()).state, 'idle');
      assert.deepEqual(await client.backupList(), []);
    } finally {
      await resetBackup(client);
    }
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });
});

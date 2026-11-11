import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BACKUP_START from './BACKUP_START';
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

describe('BACKUP START', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(BACKUP_START),
      ['BACKUP', 'START']
    );
  });

  testUtils.testWithClient('client.backupStart', async client => {
    await resetBackup(client);
    try {
      assert.equal(await client.backupStart(), 'OK');
      await waitForBackupState(client, 'incrementing');
    } finally {
      await resetBackup(client);
    }
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });
});

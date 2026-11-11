import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BACKUP_LIST from './BACKUP_LIST';
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

describe('BACKUP LIST', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(BACKUP_LIST),
      ['BACKUP', 'LIST']
    );
  });

  testUtils.testWithClient('client.backupList', async client => {
    await resetBackup(client);
    try {
      assert.deepEqual(await client.backupList(), []);
      await client.backupStart();
      await waitForBackupState(client, 'incrementing');
      const files = await client.backupList();
      assert.equal(files.length, 1);
      assert.ok(files[0].endsWith('.base.rdb'));
    } finally {
      await resetBackup(client);
    }
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });
});

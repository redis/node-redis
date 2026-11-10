import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BACKUP_SEAL from './BACKUP_SEAL';
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

describe('BACKUP SEAL', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(BACKUP_SEAL),
      ['BACKUP', 'SEAL']
    );
  });

  testUtils.testWithClient('client.backupSeal', async client => {
    await resetBackup(client);
    try {
      await client.set('key', 'value');
      await client.backupStart();
      await waitForBackupState(client, 'incrementing');
      assert.equal(await client.backupSeal(), 'OK');

      const status = await client.backupStatus();
      assert.equal(status.state, 'sealed');
      assert.equal(status.error, '');
      assert.ok(status.start_time > 0 && status.end_time >= status.start_time);

      const files = await client.backupList();
      assert.equal(files.length, 3);
      assert.ok(files[2].endsWith('appendonly.aof.manifest'));
    } finally {
      await resetBackup(client);
    }
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });

  testUtils.testWithClient('client.backupSeal without a backup in progress', async client => {
    await resetBackup(client);
    await assert.rejects(client.backupSeal(), /No backup ready to seal/);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });
});

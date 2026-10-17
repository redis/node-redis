import { strict as assert } from 'node:assert';
import XPENDING_RANGE from './XPENDING_RANGE';
import { parseArgs } from './generic-transformers';

describe('XPENDING RANGE arguments', () => {
  for (const [name, consumer] of [
    ['empty string', ''],
    ['nonempty string', 'consumer'],
    ['empty buffer', Buffer.alloc(0)],
    ['nonempty buffer', Buffer.from('consumer')]
  ] as const) {
    it(`preserves ${name} consumer`, () => {
      assert.deepEqual(
        parseArgs(XPENDING_RANGE, 'key', 'group', '-', '+', 1, { consumer }),
        ['XPENDING', 'key', 'group', '-', '+', '1', consumer]
      );
    });

    it(`preserves ${name} consumer with zero IDLE`, () => {
      assert.deepEqual(
        parseArgs(XPENDING_RANGE, 'key', 'group', '-', '+', 1, { IDLE: 0, consumer }),
        ['XPENDING', 'key', 'group', 'IDLE', '0', '-', '+', '1', consumer]
      );
    });
  }

  it('omits an unspecified consumer', () => {
    assert.deepEqual(
      parseArgs(XPENDING_RANGE, 'key', 'group', '-', '+', 1),
      ['XPENDING', 'key', 'group', '-', '+', '1']
    );
  });

  it('omits an undefined consumer', () => {
    assert.deepEqual(
      parseArgs(XPENDING_RANGE, 'key', 'group', '-', '+', 1, { consumer: undefined }),
      ['XPENDING', 'key', 'group', '-', '+', '1']
    );
  });
});

import { strict as assert } from 'node:assert';
import CLIENT_KILL, { CLIENT_KILL_FILTERS } from './CLIENT_KILL';
import { parseArgs } from './generic-transformers';

describe('CLIENT KILL', () => {
  describe('transformArguments', () => {
    it('ADDRESS', () => {
      assert.deepEqual(
        parseArgs(CLIENT_KILL, {
          filter: CLIENT_KILL_FILTERS.ADDRESS,
          address: 'ip:6379'
        }),
        ['CLIENT', 'KILL', 'ADDR', 'ip:6379']
      );
    });

    it('LOCAL_ADDRESS', () => {
      assert.deepEqual(
        parseArgs(CLIENT_KILL, {
          filter: CLIENT_KILL_FILTERS.LOCAL_ADDRESS,
          localAddress: 'ip:6379'
        }),
        ['CLIENT', 'KILL', 'LADDR', 'ip:6379']
      );
    });

    describe('ID', () => {
      it('string', () => {
        assert.deepEqual(
          parseArgs(CLIENT_KILL, {
            filter: CLIENT_KILL_FILTERS.ID,
            id: '1'
          }),
          ['CLIENT', 'KILL', 'ID', '1']
        );
      });

      it('number', () => {
        assert.deepEqual(
          parseArgs(CLIENT_KILL, {
            filter: CLIENT_KILL_FILTERS.ID,
            id: 1
          }),
          ['CLIENT', 'KILL', 'ID', '1']
        );
      });
    });

    it('TYPE', () => {
      assert.deepEqual(
        parseArgs(CLIENT_KILL, {
          filter: CLIENT_KILL_FILTERS.TYPE,
          type: 'master'
        }),
        ['CLIENT', 'KILL', 'TYPE', 'master']
      );
    });

    it('USER', () => {
      assert.deepEqual(
        parseArgs(CLIENT_KILL, {
          filter: CLIENT_KILL_FILTERS.USER,
          username: 'username'
        }),
        ['CLIENT', 'KILL', 'USER', 'username']
      );
    });

    it('MAXAGE', () => {
      assert.deepEqual(
        parseArgs(CLIENT_KILL, {
          filter: CLIENT_KILL_FILTERS.MAXAGE,
          maxAge: 10
        }),
        ['CLIENT', 'KILL', 'MAXAGE', '10']
      );
    });

    describe('SKIP_ME', () => {
      it('undefined', () => {
        assert.deepEqual(
          parseArgs(CLIENT_KILL, CLIENT_KILL_FILTERS.SKIP_ME),
          ['CLIENT', 'KILL', 'SKIPME']
        );
      });

      it('true', () => {
        assert.deepEqual(
          parseArgs(CLIENT_KILL, {
            filter: CLIENT_KILL_FILTERS.SKIP_ME,
            skipMe: true
          }),
          ['CLIENT', 'KILL', 'SKIPME', 'yes']
        );
      });

      it('false', () => {
        assert.deepEqual(
          parseArgs(CLIENT_KILL, {
            filter: CLIENT_KILL_FILTERS.SKIP_ME,
            skipMe: false
          }),
          ['CLIENT', 'KILL', 'SKIPME', 'no']
        );
      });
    });

    it('TYPE & SKIP_ME', () => {
      assert.deepEqual(
        parseArgs(CLIENT_KILL, [
          {
            filter: CLIENT_KILL_FILTERS.TYPE,
            type: 'master'
          },
          CLIENT_KILL_FILTERS.SKIP_ME
        ]),
        ['CLIENT', 'KILL', 'TYPE', 'master', 'SKIPME']
      );
    });
  });
});

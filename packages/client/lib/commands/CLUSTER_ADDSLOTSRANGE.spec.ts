import { strict as assert } from 'node:assert';
import testUtils from '../test-utils';
import CLUSTER_ADDSLOTSRANGE from './CLUSTER_ADDSLOTSRANGE';
import { parseArgs } from './generic-transformers';

describe('CLUSTER ADDSLOTSRANGE', () => {
  testUtils.isVersionGreaterThanHook([7, 0]);

  describe('transformArguments', () => {
    it('single', () => {
      assert.deepEqual(
        parseArgs(CLUSTER_ADDSLOTSRANGE, {
          start: 0,
          end: 1
        }),
        ['CLUSTER', 'ADDSLOTSRANGE', '0', '1']
      );
    });

    it('multiple', () => {
      assert.deepEqual(
        parseArgs(CLUSTER_ADDSLOTSRANGE, [{
          start: 0,
          end: 1
        }, {
          start: 2,
          end: 3
        }]),
        ['CLUSTER', 'ADDSLOTSRANGE', '0', '1', '2', '3']
      );
    });
  });
});

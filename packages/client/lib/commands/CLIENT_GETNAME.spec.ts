import { strict as assert } from 'assert';
import CLIENT_GETNAME from './CLIENT_GETNAME';

describe('CLIENT GETNAME', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CLIENT_GETNAME.transformArguments(),
      ['CLIENT', 'GETNAME']
    );
  });
});

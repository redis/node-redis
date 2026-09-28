import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { VerbatimString } from './verbatim-string';

describe('VerbatimString', () => {
  it('does not add properties to strings', () => {
    assert.equal(Reflect.has(String.prototype, 'redisVerbatimString'), false);
    assert.equal(Reflect.has(new VerbatimString('txt', 'a'), 'redisVerbatimString'), false);
    assert.deepEqual(Object.keys(new VerbatimString('txt', 'ab')), ['0', '1', 'format']);
  });

  const index = require.resolve('../../index');
  const loaders = [{
    name: 'require',
    args: ['--require', 'tsx/cjs'],
    load: `require(${JSON.stringify(index)})`
  }, {
    name: 'import',
    args: ['--import', 'tsx', '--input-type=module'],
    load: `await import(${JSON.stringify(pathToFileURL(index).href)})`
  }];

  for (const { name, args, load } of loaders) {
    it(`keeps String.prototype in fast mode after the client is loaded with ${name}`, function () {
      this.timeout(30_000);

      // A fresh process, because this one has already loaded the client.
      const output = execFileSync(process.execPath, [
        '--allow-natives-syntax',
        ...args,
        '--eval', `
          const before = %HasFastProperties(String.prototype);
          ${load};
          const after = %HasFastProperties(String.prototype);
          process.stdout.write(JSON.stringify({ before, after }));
        `
      ], {
        cwd: __dirname,
        encoding: 'utf8',
        timeout: 20_000
      });

      assert.deepEqual(JSON.parse(output), { before: true, after: true });
    });
  }
});
